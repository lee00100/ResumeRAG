// SmartProfile.tsx
import React, { useState } from 'react';

type ActiveTab = 'summary' | 'skills' | 'prep';

interface SmartProfileProps {
  analysis: any; // Replace 'any' with proper type if known
  smartProfile: any; // Replace 'any' with proper type if known
  isGenerating: boolean;
  error: string | null;
  onGenerate: () => void;
}

const SmartProfile: React.FC<SmartProfileProps> = ({
  analysis,
  smartProfile,
  isGenerating,
  error,
  onGenerate
}) => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('summary');

  const renderContent = () => {
    switch (activeTab) {
      case 'summary':
        return <div>{analysis?.summary || 'No summary available'}</div>;
      case 'skills':
        return <div>{smartProfile?.skills?.join(', ') || 'No skills listed'}</div>;
      case 'prep':
        return <div>Preparation tips go here</div>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="tabs">
        <button onClick={() => setActiveTab('summary')}>Summary</button>
        <button onClick={() => setActiveTab('skills')}>Skills</button>
        <button onClick={() => setActiveTab('prep')}>Prep</button>
      </div>

      <div className="content">
        {renderContent()}
      </div>

      <div className="actions">
        {error && <p className="error">{error}</p>}
        <button onClick={onGenerate} disabled={isGenerating}>
          {isGenerating ? 'Generating...' : 'Generate'}
        </button>
      </div>
    </div>
  );
};

export default SmartProfile;
