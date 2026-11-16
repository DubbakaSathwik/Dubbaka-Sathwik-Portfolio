import React, { useCallback, useEffect, useState } from 'react';
import { ShieldAlert, ShieldCheck, RefreshCw, CheckSquare, Square, Lock, X, Loader2 } from 'lucide-react';
import { getCurrentVisitorId, markLocalHumanVerified } from '../../utils/telemetry';

interface ChallengeDetail {
  visitorId?: string;
  classification?: string;
  riskScore?: number;
  reason?: string;
  isTestMode?: boolean;
}

export function HumanVerificationGate() {
  const [isOpen, setIsOpen] = useState(false);
  const [detail, setDetail] = useState<ChallengeDetail>({});
  const [challengeToken, setChallengeToken] = useState('');
  const [captchaSvgUrl, setCaptchaSvgUrl] = useState('');
  const [isLoadingCaptcha, setIsLoadingCaptcha] = useState(false);
  const [checkboxConfirmed, setCheckboxConfirmed] = useState(false);
  const [answer, setAnswer] = useState('');
  const [interactionCount, setInteractionCount] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [verifiedSuccess, setVerifiedSuccess] = useState(false);
  const [cooldownUntil, setCooldownUntil] = useState(0);

  const loadChallenge = useCallback(async (visitorId?: string) => {
    setIsLoadingCaptcha(true);
    setErrorMessage('');
    setAnswer('');
    try {
      const vid = visitorId || getCurrentVisitorId();
      const res = await fetch(`/api/telemetry/challenge?visitorId=${encodeURIComponent(vid)}`);
      const contentType = res.headers.get('content-type') || '';
      if (!res.ok || !contentType.includes('application/json')) {
        throw new Error('Could not load verification image. Please retry.');
      }
      const json = await res.json();
      if (!json.success || !json.challengeToken || !json.captchaSvgDataUrl) {
        throw new Error('Verification service unavailable right now.');
      }
      setChallengeToken(json.challengeToken);
      setCaptchaSvgUrl(json.captchaSvgDataUrl);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to generate security CAPTCHA.');
    } finally {
      setIsLoadingCaptcha(false);
    }
  }, []);

  useEffect(() => {
    const handleTrigger = (e: Event) => {
      const custom = e as CustomEvent<ChallengeDetail>;
      const payload = custom?.detail || {};
      setDetail(payload);
      setCheckboxConfirmed(false);
      setVerifiedSuccess(false);
      setInteractionCount(0);
      setIsOpen(true);
      loadChallenge(payload.visitorId);
    };

    window.addEventListener('portfolio:human-challenge', handleTrigger);
    return () => window.removeEventListener('portfolio:human-challenge', handleTrigger);
  }, [loadChallenge]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (Date.now() < cooldownUntil) {
      const waitSec = Math.ceil((cooldownUntil - Date.now()) / 1000);
      setErrorMessage(`Please wait ${waitSec}s before retrying.`);
      return;
    }

    if (!checkboxConfirmed) {
      setErrorMessage('Please check "I am not a bot" before submitting.');
      return;
    }

    if (!answer.trim()) {
      setErrorMessage('Enter the 6 verification characters shown in the image.');
      return;
    }

    setIsVerifying(true);
    setErrorMessage('');

    try {
      const vid = detail.visitorId || getCurrentVisitorId();
      const res = await fetch('/api/telemetry/verify-human', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          visitorId: vid,
          challengeToken,
          answer: answer.trim(),
          checkboxConfirmed,
          interactionCount,
        }),
      });

      const contentType = res.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new Error('Unexpected response from security gateway.');
      }

      const json = await res.json();
      if (!res.ok || !json.verified) {
        setCooldownUntil(Date.now() + 2000);
        setErrorMessage(json.message || 'Verification failed. A fresh code has been generated.');
        await loadChallenge(vid);
        return;
      }

      markLocalHumanVerified();
      setVerifiedSuccess(true);
      setTimeout(() => {
        setIsOpen(false);
        setVerifiedSuccess(false);
      }, 1100);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Verification error. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="human-verification-title"
      onMouseMove={() => setInteractionCount((c) => Math.min(999, c + 1))}
      onKeyDown={() => setInteractionCount((c) => Math.min(999, c + 1))}
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl"
    >
      <div className="relative w-full max-w-md rounded-2xl bg-[#09090b] border border-zinc-800 shadow-2xl p-6 sm:p-7 space-y-5">
        {detail.isTestMode && (
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            aria-label="Close Security Test"
            className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-800 cursor-pointer transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        )}

        <div className="flex items-start gap-3.5 pr-6">
          <div
            className={`p-2.5 rounded-xl border shrink-0 ${
              verifiedSuccess
                ? 'bg-emerald-950/70 border-emerald-500/40 text-emerald-400'
                : 'bg-amber-950/50 border-amber-500/40 text-amber-400'
            }`}
          >
            {verifiedSuccess ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <ShieldAlert className="w-6 h-6" />
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 id="human-verification-title" className="text-lg font-bold text-white tracking-tight">
                Human Security Verification
              </h2>
              {detail.isTestMode && (
                <span className="px-2 py-0.5 rounded bg-sky-950 border border-sky-500/30 text-sky-300 text-[10px] font-mono">
                  Test Mode
                </span>
              )}
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Unusual automated signals were detected. Complete this quick verification to continue browsing normally — no sign-in required.
            </p>
          </div>
        </div>

        <div className="px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800/80 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span>Session ID: <strong className="text-zinc-200">{detail.visitorId || getCurrentVisitorId()}</strong></span>
          <span className="text-amber-400 tabular-nums">
            Risk {typeof detail.riskScore === 'number' ? detail.riskScore : 65}/100
          </span>
        </div>

        {verifiedSuccess ? (
          <div className="p-5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-center space-y-2">
            <ShieldCheck className="w-9 h-9 text-emerald-400 mx-auto" />
            <p className="text-sm font-semibold text-white">Verified Human Visitor</p>
            <p className="text-xs text-emerald-300 font-mono">Security gate unlocked. Redirecting...</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Step 1: Interactive "I am not a bot" confirmation */}
            <button
              type="button"
              onClick={() => {
                setCheckboxConfirmed((prev) => !prev);
                setInteractionCount((c) => c + 1);
                setErrorMessage('');
              }}
              className={`w-full flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer text-left ${
                checkboxConfirmed
                  ? 'bg-emerald-950/30 border-emerald-500/50 text-white'
                  : 'bg-zinc-900/70 border-zinc-800 text-zinc-300 hover:border-zinc-700'
              }`}
            >
              <div className="flex items-center gap-3">
                {checkboxConfirmed ? (
                  <CheckSquare className="w-5 h-5 text-emerald-400 shrink-0" />
                ) : (
                  <Square className="w-5 h-5 text-zinc-500 shrink-0" />
                )}
                <div>
                  <span className="text-sm font-semibold block">I am not a bot</span>
                  <span className="text-[11px] text-zinc-400 font-mono">Human interaction check</span>
                </div>
              </div>
              <Lock className={`w-4 h-4 ${checkboxConfirmed ? 'text-emerald-400' : 'text-zinc-600'}`} />
            </button>

            {/* Step 2: Distorted SVG CAPTCHA */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-mono text-zinc-400 uppercase tracking-wider">
                  Security Code Verification
                </label>
                <button
                  type="button"
                  onClick={() => loadChallenge(detail.visitorId)}
                  disabled={isLoadingCaptcha}
                  className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3 h-3 ${isLoadingCaptcha ? 'animate-spin' : ''}`} />
                  <span>New Code</span>
                </button>
              </div>

              <div className="flex items-center justify-center p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 min-h-[88px]">
                {isLoadingCaptcha ? (
                  <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                ) : captchaSvgUrl ? (
                  <img
                    src={captchaSvgUrl}
                    alt="Security CAPTCHA verification code"
                    className="h-[74px] w-[220px] select-none pointer-events-none rounded-lg"
                    draggable={false}
                  />
                ) : (
                  <span className="text-xs font-mono text-zinc-500">Captcha unavailable</span>
                )}
              </div>

              <input
                type="text"
                inputMode="text"
                autoComplete="off"
                spellCheck={false}
                maxLength={10}
                placeholder="Type the 6 characters above"
                value={answer}
                onChange={(e) => {
                  setAnswer(e.target.value.toUpperCase());
                  setInteractionCount((c) => c + 1);
                  setErrorMessage('');
                }}
                className="w-full px-3.5 py-2.5 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-emerald-500 focus:outline-none text-sm font-mono tracking-[0.25em] text-center text-white uppercase placeholder:tracking-normal placeholder:normal-case"
              />
            </div>

            {errorMessage && (
              <div className="px-3 py-2 rounded-lg bg-rose-950/50 border border-rose-500/40 text-rose-300 text-xs font-mono">
                {errorMessage}
              </div>
            )}

            <button
              type="submit"
              disabled={isVerifying || isLoadingCaptcha}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold text-sm transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying Human Session...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Verify &amp; Continue</span>
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
