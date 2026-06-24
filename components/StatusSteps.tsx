'use client';

export interface Step {
  label: string;
  status: 'pending' | 'active' | 'done';
}

interface StatusStepsProps {
  steps: Step[];
}

export default function StatusSteps({ steps }: StatusStepsProps) {
  return (
    <div className="mt-3 space-y-0">
      {steps.map((step, i) => {
        const isLast = i === steps.length - 1;

        return (
          <div key={step.label} className="flex items-stretch gap-3">
            {/* Icon column with connecting line */}
            <div className="flex flex-col items-center">
              {/* Icon */}
              <div className="relative flex h-6 w-6 shrink-0 items-center justify-center">
                {step.status === 'done' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/20">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 12 12"
                      fill="none"
                      className="text-emerald-400"
                    >
                      <path
                        d="M2.5 6L5 8.5L9.5 3.5"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                )}
                {step.status === 'active' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-500/20">
                    <span className="block h-2.5 w-2.5 animate-pulse-dot rounded-full bg-brand-500" />
                  </div>
                )}
                {step.status === 'pending' && (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-white/5">
                    <span className="block h-2 w-2 rounded-full bg-gray-600" />
                  </div>
                )}
              </div>

              {/* Connecting line */}
              {!isLast && (
                <div
                  className={`w-px flex-1 min-h-3 transition-colors duration-500 ${
                    step.status === 'done' ? 'bg-emerald-500/30' : 'bg-white/[0.06]'
                  }`}
                />
              )}
            </div>

            {/* Label */}
            <span
              className={`pb-3 text-sm leading-6 transition-colors duration-300 ${
                step.status === 'done'
                  ? 'text-emerald-400'
                  : step.status === 'active'
                    ? 'text-brand-400 font-medium'
                    : 'text-gray-500'
              }`}
            >
              {step.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}
