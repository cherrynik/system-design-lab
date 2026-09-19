import { FiArrowRight } from 'react-icons/fi';
import { getArchitectureVariant } from '../model/catalog';
import { getConnectionStateText } from '../model/connections';
import type { ArchitectureConnectionSummaryProps } from './ArchitectureLayerItem.types';

const missingText = (direction: 'incoming' | 'outgoing') => {
  if (direction === 'incoming') return 'Choose source';
  return 'Choose destination';
};

export function ArchitectureConnectionSummary({
  connectionState,
}: ArchitectureConnectionSummaryProps) {
  return (
    <span
      className={`layer-item__connections layer-item__connections--${connectionState.state}`}
      aria-label={getConnectionStateText(connectionState)}
    >
      {connectionState.incoming.map((related) => {
        const RelatedIcon = getArchitectureVariant(related.data.kind, related.data.variantId).icon;
        return (
          <span
            className="component-link component-link--incoming"
            aria-label={`Connected from ${related.data.label}`}
            key={`in-${related.id}`}
          >
            <RelatedIcon aria-hidden="true" focusable="false" />
            <b>{related.data.label}</b>
            <FiArrowRight aria-hidden="true" focusable="false" />
          </span>
        );
      })}
      {connectionState.outgoing.map((related) => {
        const RelatedIcon = getArchitectureVariant(related.data.kind, related.data.variantId).icon;
        return (
          <span
            className="component-link component-link--outgoing"
            aria-label={`Connected to ${related.data.label}`}
            key={`out-${related.id}`}
          >
            <FiArrowRight aria-hidden="true" focusable="false" />
            <RelatedIcon aria-hidden="true" focusable="false" />
            <b>{related.data.label}</b>
          </span>
        );
      })}
      {connectionState.missing.map((direction) => (
        <span className="component-link component-link--missing" key={direction}>
          <i />
          {missingText(direction)}
        </span>
      ))}
    </span>
  );
}
