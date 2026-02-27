'use client';

import type { TeamBlock } from '@/types/content';
import { ArrayField } from './ArrayField';

interface Props {
  value: TeamBlock;
  onChange: (value: TeamBlock) => void;
}

interface TeamMember {
  initial: string;
  role: string;
  description: string;
}

export function TeamEditor({ value, onChange }: Props) {
  const handleChange = (field: keyof TeamBlock, newValue: any) => {
    onChange({
      ...value,
      [field]: newValue
    });
  };

  const handleMembersChange = (members: TeamMember[]) => {
    handleChange('members', members);
  };

  const renderMember = (member: TeamMember, index: number, onMemberChange: (member: TeamMember) => void) => (
    <div className="space-y-3 border border-[var(--color-border)] p-3 bg-[var(--color-hover)]">
      <div className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider">
        Team Member {index + 1}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Initial */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Initial
          </label>
          <input
            type="text"
            value={member.initial || ''}
            onChange={(e) => onMemberChange({ ...member, initial: e.target.value })}
            placeholder="JD"
            maxLength={2}
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>

        {/* Role */}
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Role
          </label>
          <input
            type="text"
            value={member.role || ''}
            onChange={(e) => onMemberChange({ ...member, role: e.target.value })}
            placeholder="CEO & Founder"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Description */}
      <div>
        <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
          Description
        </label>
        <textarea
          value={member.description || ''}
          onChange={(e) => onMemberChange({ ...member, description: e.target.value })}
          placeholder="Brief description of the team member..."
          rows={3}
          className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors resize-vertical"
        />
      </div>
    </div>
  );

  const createEmptyMember = (): TeamMember => ({
    initial: '',
    role: '',
    description: ''
  });

  return (
    <div className="space-y-4">
      {/* Team Settings */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Heading (Optional)
          </label>
          <input
            type="text"
            value={value.heading || ''}
            onChange={(e) => handleChange('heading', e.target.value)}
            placeholder="Meet the Team"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
        <div>
          <label className="text-xs font-medium text-[var(--color-muted)] uppercase tracking-wider mb-1 block">
            Subtitle (Optional)
          </label>
          <input
            type="text"
            value={value.subtitle || ''}
            onChange={(e) => handleChange('subtitle', e.target.value)}
            placeholder="The people behind the product"
            className="w-full border border-[var(--color-border)] px-3 py-2 text-sm text-[var(--color-text)] focus:border-[var(--color-text)] focus:outline-none transition-colors"
          />
        </div>
      </div>

      {/* Team Members */}
      <ArrayField
        items={value.members}
        onChange={handleMembersChange}
        renderItem={renderMember}
        createEmpty={createEmptyMember}
        label="Team Members"
        addLabel="Add Team Member"
      />
    </div>
  );
}