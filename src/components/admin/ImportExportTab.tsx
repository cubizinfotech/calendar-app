
import { useState } from 'react';
import ImportSection from './import-export/ImportSection';
import ExportSection from './import-export/ExportSection';

const ImportExportTab = () => {
  return (
    <div className="space-y-6">
      <ImportSection />
      <ExportSection />
    </div>
  );
};

export default ImportExportTab;
