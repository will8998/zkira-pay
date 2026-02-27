'use client';

import type { ContentBlock } from '@/types/content';
import { TextEditor } from './TextEditor';
import { BlockquoteEditor } from './BlockquoteEditor';
import { CardsEditor } from './CardsEditor';
import { FAQEditor } from './FAQEditor';
import { StatsEditor } from './StatsEditor';
import { CTAEditor } from './CTAEditor';
import { CodeBlockEditor } from './CodeBlockEditor';
import { ListEditor } from './ListEditor';
import { TeamEditor } from './TeamEditor';
import { TimelineEditor } from './TimelineEditor';
import { ChangelogEditor } from './ChangelogEditor';
import { LegalEditor } from './LegalEditor';
import { StepsEditor } from './StepsEditor';
import { ComparisonEditor } from './ComparisonEditor';

interface Props {
  block: ContentBlock;
  onChange: (block: ContentBlock) => void;
}

export function ContentBlockEditor({ block, onChange }: Props) {
  switch (block.type) {
    case 'text':
      return <TextEditor value={block} onChange={onChange} />;
    
    case 'blockquote':
      return <BlockquoteEditor value={block} onChange={onChange} />;
    
    case 'cards':
      return <CardsEditor value={block} onChange={onChange} />;
    
    case 'faq':
      return <FAQEditor value={block} onChange={onChange} />;
    
    case 'stats':
      return <StatsEditor value={block} onChange={onChange} />;
    
    case 'cta':
      return <CTAEditor value={block} onChange={onChange} />;
    
    case 'code':
      return <CodeBlockEditor value={block} onChange={onChange} />;
    
    case 'list':
      return <ListEditor value={block} onChange={onChange} />;
    
    case 'team':
      return <TeamEditor value={block} onChange={onChange} />;
    
    case 'timeline':
      return <TimelineEditor value={block} onChange={onChange} />;
    
    case 'changelog':
      return <ChangelogEditor value={block} onChange={onChange} />;
    
    case 'legal':
      return <LegalEditor value={block} onChange={onChange} />;
    
    case 'steps':
      return <StepsEditor value={block} onChange={onChange} />;
    
    case 'comparison':
      return <ComparisonEditor value={block} onChange={onChange} />;
    
    default:
      return (
        <div className="bg-[#FEF2F2] border border-[#FECACA] p-4 text-[#B91C1C]">
          <p className="text-sm font-medium">Unknown block type: {(block as any).type}</p>
          <p className="text-xs mt-1">This block type is not supported by the content editor.</p>
        </div>
      );
  }
}