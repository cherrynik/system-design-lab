import { Checkbox, Tooltip, TooltipContent, TooltipTrigger } from '@/shared/ui';
import type { ValidationLiveChecksProps } from './ValidationLiveChecks.types';

export function ValidationLiveChecks({ enabled, issueCount, onChange }: ValidationLiveChecksProps) {
  const issueNoun = issueCount === 1 ? 'connection issue' : 'connection issues';
  const summary = `${issueCount} ${issueNoun}`;
  let description =
    'Check connections as you edit. Full validation and attempts run with Validate.';
  if (enabled && issueCount === 0)
    description = 'No connection issues. Full validation runs with Validate.';
  if (enabled && issueCount > 0)
    description = `${summary}. Hover a warning on the canvas for details.`;
  return (
    <Tooltip>
      <TooltipTrigger>
        <div className="validation-live-checks" data-has-issues={enabled && issueCount > 0}>
          <Checkbox
            label="Live"
            aria-label="Live connection checks"
            checked={enabled}
            onChange={(event) => onChange(event.currentTarget.checked)}
          />
          {enabled && issueCount > 0 && (
            <span className="validation-live-checks__count" role="status" aria-label={summary}>
              {issueCount}
            </span>
          )}
        </div>
      </TooltipTrigger>
      <TooltipContent>{description}</TooltipContent>
    </Tooltip>
  );
}
