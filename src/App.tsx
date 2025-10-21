import { useState, useMemo } from "react";
import { iconData, IconItem, IconData } from "./data/iconData";
import { FolderNav } from "./components/FolderNav";
import { IconGrid } from "./components/IconGrid";

export default function App() {
  const [currentIconData, setCurrentIconData] = useState<IconData>(iconData);
  // R-6, F-003: Default to "All Icons" (null = all icons)
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  const handleScanComplete = (newIconData: IconData) => {
    setCurrentIconData(newIconData);
    setSelectedFolder(null); // Reset to "All Icons"
  };

  // Get list of all folders from icon data (R-5)
  const folders = useMemo(() => Object.keys(currentIconData).sort(), [currentIconData]);
  
  // R-9: Filter icons based on selected folder
  const filteredIcons = useMemo(() => {
    const icons: IconItem[] = [];
    
    if (selectedFolder === null) {
      // Show all icons from all folders
      Object.values(currentIconData).forEach((folderIcons) => {
        icons.push(...folderIcons);
      });
    } else {
      // Show icons only from selected folder (F-004)
      icons.push(...(currentIconData[selectedFolder] || []));
    }
    
    return icons;
  }, [selectedFolder, currentIconData]);

  return (
    <div className="size-full flex">
      {/* F-002: LNB folder menu */}
      <FolderNav
        folders={folders}
        selectedFolder={selectedFolder}
        onSelectFolder={setSelectedFolder}
        onScanComplete={handleScanComplete}
      />
      
      {/* F-005: 8-column grid view */}
      <IconGrid
        icons={filteredIcons}
        selectedFolder={selectedFolder}
      />
    </div>
  );
}