"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PageHeader } from "@/components/page-header";
import { useAuth } from "@/components/auth-provider";
import { canEdit } from "@/lib/auth/rbac";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/components/ui/toast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus, faTrash, faSave, faLock } from "@fortawesome/free-solid-svg-icons";

type Kpi = {
  id?: string;
  label: string;
  value: string;
  delta: string;
  trend: 'up' | 'down' | 'neutral';
  progress: number;
};

export default function AdminPage() {
  const { role } = useAuth();
  const [kpis, setKpis] = useState<Kpi[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchKpis();
  }, []);

  const fetchKpis = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('content_manager_elecciones_kpis').select('*').order('created_at', { ascending: true });
    if (error) {
      console.error("Error fetching KPIs:", error);
    } else {
      setKpis(data || []);
    }
    setLoading(false);
  };

  const handleKpiChange = (index: number, field: keyof Kpi, value: string | number) => {
    const newKpis = [...kpis];
    newKpis[index] = { ...newKpis[index], [field]: value };
    setKpis(newKpis);
  };

  const saveKpis = async () => {
    setSaving(true);
    // Para simplificar, guardamos uno a uno (upsert requiere pkey si existe)
    for (const kpi of kpis) {
      if (kpi.id) {
        await supabase.from('content_manager_elecciones_kpis').update(kpi).eq('id', kpi.id);
      } else {
        await supabase.from('content_manager_elecciones_kpis').insert(kpi);
      }
    }
    toast.success("Datos guardados correctamente");
    fetchKpis();
    setSaving(false);
  };

  const addKpi = () => {
    setKpis([...kpis, { label: '', value: '', delta: '', trend: 'neutral', progress: 0 }]);
  };

  const deleteKpi = async (index: number, id?: string) => {
    if (id) {
        await supabase.from('content_manager_elecciones_kpis').delete().eq('id', id);
    }
    const newKpis = kpis.filter((_, i) => i !== index);
    setKpis(newKpis);
  };

  if (!canEdit(role)) {
      return (
          <div className="h-screen page-bg text-white flex flex-col justify-center items-center gap-4">
              <FontAwesomeIcon icon={faLock} className="text-6xl text-red-500 mb-2" />
              <h1 className="text-2xl font-bold">Acceso No Autorizado</h1>
              <p className="text-[#aab3cf]">Esta página está reservada para administradores del sistema.</p>
              <Button variant="neon" onClick={() => window.location.href = '/elecciones'}>
                  Volver al Tablero
              </Button>
          </div>
      );
  }

  return (
    <div className="p-6 page-bg text-white">
      <PageHeader 
        title="Panel de Administración" 
        description="Administra los datos de los tableros que luego se leerán dinámicamente desde Supabase."
        badges={[]} 
      />

      <div className="mt-8 space-y-8 max-w-4xl">
        <Card className="p-6 panel border-[#2a2a4a]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-[#75ddff] to-emerald-400">
              KPIs de Elecciones
            </h2>
            <Button onClick={saveKpis} disabled={saving} className="bg-emerald-500 hover:bg-emerald-600 text-white">
              <FontAwesomeIcon icon={faSave} className="mr-2" />
              {saving ? 'Guardando...' : 'Guardar Cambios'}
            </Button>
          </div>

          {loading ? (
            <div className="text-[#aab3cf]">Cargando datos...</div>
          ) : (
            <div className="space-y-4">
              {kpis.map((kpi, i) => (
                <div key={i} className="grid grid-cols-12 gap-3 items-center bg-[#10142a] p-4 rounded-lg border border-[#1e2240]">
                  <div className="col-span-3">
                    <label className="text-xs text-[#aab3cf] mb-1 block">Etiqueta</label>
                    <Input 
                      value={kpi.label} 
                      onChange={(e) => handleKpiChange(i, 'label', e.target.value)} 
                      placeholder="Ej. Potencial Electoral"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#aab3cf] mb-1 block">Valor</label>
                    <Input 
                      value={kpi.value} 
                      onChange={(e) => handleKpiChange(i, 'value', e.target.value)} 
                      placeholder="Ej. 38.8M"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#aab3cf] mb-1 block">Delta</label>
                    <Input 
                      value={kpi.delta || ''} 
                      onChange={(e) => handleKpiChange(i, 'delta', e.target.value)} 
                      placeholder="+2.4%"
                    />
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#aab3cf] mb-1 block">Tendencia</label>
                    <select 
                      className="w-full h-8 rounded-lg bg-transparent border border-input px-2.5 py-1 text-sm text-foreground outline-none focus:ring-2 focus:ring-ring"
                      value={kpi.trend}
                      onChange={(e) => handleKpiChange(i, 'trend', e.target.value as any)}
                    >
                      <option value="up" className="bg-[#10142a]">Up</option>
                      <option value="neutral" className="bg-[#10142a]">Neutral</option>
                      <option value="down" className="bg-[#10142a]">Down</option>
                    </select>
                  </div>
                  <div className="col-span-2">
                    <label className="text-xs text-[#aab3cf] mb-1 block">Progreso (%)</label>
                    <Input 
                      type="number"
                      value={kpi.progress} 
                      onChange={(e) => handleKpiChange(i, 'progress', parseInt(e.target.value))} 
                      placeholder="70"
                    />
                  </div>
                  <div className="col-span-1 flex justify-end mt-5">
                    <Button variant="ghost" className="text-red-400 hover:text-red-300 hover:bg-red-400/10" onClick={() => deleteKpi(i, kpi.id)}>
                      <FontAwesomeIcon icon={faTrash} />
                    </Button>
                  </div>
                </div>
              ))}

              <Button variant="outline" className="w-full border-dashed border-[#2a2a4a] text-[#c0c8de] hover:text-white" onClick={addKpi}>
                <FontAwesomeIcon icon={faPlus} className="mr-2" /> Agregar KPI
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
