"use client";

import { useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faGear } from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "./auth-provider";
import { canEdit } from "@/lib/auth/rbac";

export function AdminPopup({ children, title = "Panel de Administración", hideTrigger = false, open, onOpenChange }: { children: React.ReactNode, title?: string, hideTrigger?: boolean, open?: boolean, onOpenChange?: (open: boolean) => void }) {
  const { role } = useAuth();

  if (!canEdit(role)) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      {!hideTrigger && (
        <SheetTrigger className="fixed bottom-6 right-6 z-50 bg-[#c77dff] hover:bg-[#b05eed] text-white border-0 shadow-lg shadow-purple-500/20 rounded-full w-12 h-12 p-0 flex items-center justify-center">
          <FontAwesomeIcon icon={faGear} className="w-5 h-5" />
        </SheetTrigger>
      )}
      
      <SheetContent side="right" className="bg-[#0b101d]/70 backdrop-blur-md text-white border-l border-white/10 w-full sm:max-w-xl md:max-w-2xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="text-white text-xl font-bold border-b border-white/10 pb-4">{title}</SheetTitle>
        </SheetHeader>
        
        <div className="mt-6 flex-1 h-full overflow-y-auto w-full pb-10">
          <div className="animate-in fade-in duration-500 w-full h-full">
            {children}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
