/* eslint-disable @next/next/no-img-element */
import { IconItem } from "@/data/iconData";
import { FileImage } from "lucide-react";

interface IconGridProps {
  icons: IconItem[];
  selectedFolder: string | null;
}

export function IconGrid({ icons, selectedFolder }: IconGridProps) {
  return (
    <div className="flex-1 overflow-auto">
      <div className="p-6">
        <div className="mb-4">
          <h1>{selectedFolder || "모든 아이콘"}</h1>
          <p className="text-muted-foreground">
            {icons.length}개의 아이콘
          </p>
        </div>
        
        <div className="grid grid-cols-8 gap-4">
          {icons.map((icon, index) => (
            <div
              key={`${icon.path}-${index}`}
              className="flex flex-col items-center p-4 rounded-lg border border-border hover:bg-accent/50 transition-colors cursor-pointer group"
            >
              <img src={icon.path} alt={icon.name} className="w-12 h-12 object-contain mb-2" />
              <p className="text-xs text-center break-all line-clamp-2 group-hover:text-accent-foreground">
                {icon.name}
              </p>
            </div>
          ))}
        </div>
        
        {icons.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <FileImage className="w-16 h-16 mb-4" />
            <p>이 폴더에 아이콘이 없습니다</p>
          </div>
        )}
      </div>
    </div>
  );
}
