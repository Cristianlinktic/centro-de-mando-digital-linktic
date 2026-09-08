"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Users, Plus, Pencil, Trash2, Loader2, X, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AppRole, ScreenDef } from "@/lib/auth/rbac";

interface UserRow {
  id: string;
  email: string;
  role: string;
  full_name: string;
  screens: string[];
}

const ROLE_OPTIONS: { value: AppRole; label: string }[] = [
  { value: "viewer", label: "Visualizador" },
  { value: "admin", label: "Administrador" },
  { value: "superadmin", label: "Superadministrador" },
];

function roleLabel(role: string): string {
  return ROLE_OPTIONS.find((r) => r.value === role)?.label ?? "Visualizador";
}

function roleBadgeClass(role: string): string {
  if (role === "superadmin") return "bg-fuchsia-500/10 text-fuchsia-300 border-fuchsia-500/20";
  if (role === "admin") return "bg-emerald-500/10 text-emerald-300 border-emerald-500/20";
  return "bg-white/5 text-[#aab3cf] border-[#2a2a4a]";
}

/* ------------------------------ Notificaciones ------------------------------ */
type Note = { id: number; kind: "success" | "error"; text: string };

function useNotes() {
  const [notes, setNotes] = useState<Note[]>([]);
  const notify = (kind: Note["kind"], text: string) => {
    const id = Date.now() + Math.random();
    setNotes((n) => [...n, { id, kind, text }]);
    setTimeout(() => setNotes((n) => n.filter((x) => x.id !== id)), 4000);
  };
  const view = (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-2">
      {notes.map((n) => (
        <div
          key={n.id}
          className={cn(
            "rounded-xl px-4 py-3 text-sm font-semibold shadow-lg border max-w-xs",
            n.kind === "success"
              ? "bg-emerald-500/10 text-emerald-200 border-emerald-500/30"
              : "bg-rose-500/10 text-rose-200 border-rose-500/30",
          )}
        >
          {n.text}
        </div>
      ))}
    </div>
  );
  return { notify, view };
}

export function UsersAdminView() {
  const { notify, view: notesView } = useNotes();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [screens, setScreens] = useState<ScreenDef[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<UserRow | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/users");
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Error cargando usuarios");
      setUsers(json.users);
      setScreens(json.screens);
    } catch (e: unknown) {
      notify("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect, react-hooks/exhaustive-deps
    load();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setModalOpen(true);
  };
  const openEdit = (u: UserRow) => {
    setEditing(u);
    setModalOpen(true);
  };

  const handleDelete = async (u: UserRow) => {
    if (!confirm(`¿Eliminar al usuario ${u.email}? Esta acción no se puede deshacer.`)) return;
    const res = await fetch(`/api/admin/users/${u.id}`, { method: "DELETE" });
    const json = await res.json();
    if (!res.ok) {
      notify("error", json.error || "No se pudo eliminar");
      return;
    }
    notify("success", `Usuario eliminado: ${u.email}`);
    load();
  };

  return (
    <div className="space-y-8 p-6 pb-12 page-bg">
      {notesView}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-heading flex items-center gap-2 text-2xl font-bold">
            <ShieldCheck className="h-6 w-6 text-[#0094ff]" />
            <span className="gradient-text">Administración de Usuarios</span>
          </h1>
          <div className="accent-bar accent-bar-anim mt-2 mb-1" />
          <p className="text-[#aab3cf] font-medium text-sm">
            Crea usuarios, asigna roles y controla a qué pantallas accede cada uno.
          </p>
        </div>
        <button
          onClick={openCreate}
          className="flex items-center gap-2 bg-[#0094ff] hover:bg-[#00e1ff] text-white px-5 py-2.5 rounded-xl font-bold transition-all"
        >
          <Plus className="h-4 w-4" /> Nuevo usuario
        </button>
      </div>

      <div className="glass rounded-2xl overflow-hidden border border-[#2a2a4a]">
        {loading ? (
          <div className="flex items-center justify-center gap-3 py-16 text-[#aab3cf]">
            <Loader2 className="h-5 w-5 animate-spin" /> Cargando usuarios…
          </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center gap-3 py-16 text-[#aab3cf]">
            <Users className="h-10 w-10 opacity-20" />
            <p className="font-bold text-sm">No hay usuarios</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs uppercase text-[#aab3cf] bg-white/5 border-b border-[#2a2a4a]">
                <tr>
                  <th className="px-4 py-3">Usuario</th>
                  <th className="px-4 py-3">Rol</th>
                  <th className="px-4 py-3">Pantallas</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#1e2240] hover:bg-white/5 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-bold text-white">{u.full_name || u.email.split("@")[0]}</div>
                      <div className="text-xs text-[#8892b0]">{u.email}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn("px-2.5 py-1 rounded-full text-xs font-bold border", roleBadgeClass(u.role))}>
                        {roleLabel(u.role)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-[#aab3cf] font-medium">
                      {u.role === "superadmin" ? "Todas" : `${u.screens.length}`}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-2 rounded-lg bg-white/5 text-[#aab3cf] hover:text-[#75ddff] transition-colors"
                          title="Editar"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(u)}
                          className="p-2 rounded-lg bg-white/5 text-[#aab3cf] hover:text-rose-400 transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modalOpen && (
        <UserFormModal
          screens={screens}
          editing={editing}
          notify={notify}
          onClose={() => setModalOpen(false)}
          onSaved={() => {
            setModalOpen(false);
            load();
          }}
        />
      )}
    </div>
  );
}

/* ============================= Modal Crear/Editar ============================= */
function UserFormModal({
  screens,
  editing,
  notify,
  onClose,
  onSaved,
}: {
  screens: ScreenDef[];
  editing: UserRow | null;
  notify: (kind: "success" | "error", text: string) => void;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!editing;
  const [username, setUsername] = useState(editing?.email ?? "");
  const [fullName, setFullName] = useState(editing?.full_name ?? "");
  const [role, setRole] = useState<AppRole>((editing?.role as AppRole) ?? "viewer");
  const [password, setPassword] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set(editing?.screens ?? []));
  const [saving, setSaving] = useState(false);

  const grouped = useMemo(() => {
    const map = new Map<string, ScreenDef[]>();
    for (const s of screens) {
      const arr = map.get(s.group) ?? [];
      arr.push(s);
      map.set(s.group, arr);
    }
    return Array.from(map.entries());
  }, [screens]);

  const toggle = (key: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const save = async () => {
    setSaving(true);
    try {
      if (isEdit) {
        const res = await fetch(`/api/admin/users/${editing!.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ role, full_name: fullName, screens: Array.from(selected) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        if (password) {
          const pr = await fetch(`/api/admin/users/${editing!.id}/password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ password }),
          });
          const pj = await pr.json();
          if (!pr.ok) throw new Error(pj.error);
        }
        notify("success", `Usuario actualizado: ${editing!.email}`);
      } else {
        const res = await fetch("/api/admin/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username, password, full_name: fullName, role, screens: Array.from(selected) }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error);
        notify("success", `Usuario creado: ${username}`);
      }
      onSaved();
    } catch (e: unknown) {
      notify("error", (e as Error).message || "Error");
    } finally {
      setSaving(false);
    }
  };

  const screensDisabled = role === "superadmin";
  const inputCls =
    "w-full rounded-xl px-3 py-2.5 text-sm text-white bg-white/5 border border-[#2a2a4a] focus:border-[#0094ff] focus:outline-none disabled:opacity-50";

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 panel border border-[#2a2a4a] shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-black text-white">{isEdit ? "Editar usuario" : "Nuevo usuario"}</h2>
          <button onClick={onClose} className="p-1.5 text-[#aab3cf] hover:text-white">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#aab3cf] uppercase tracking-wider">Usuario / correo</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={isEdit}
              placeholder="ej: admin_linktic"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#aab3cf] uppercase tracking-wider">Nombre visible</label>
            <input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ej: Cristian Sabogal"
              className={inputCls}
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#aab3cf] uppercase tracking-wider">Rol</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as AppRole)}
              className={cn(inputCls, "[color-scheme:dark]")}
            >
              {ROLE_OPTIONS.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-[#aab3cf] uppercase tracking-wider">
              {isEdit ? "Nueva contraseña (opcional)" : "Contraseña"}
            </label>
            <input
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="mínimo 6 caracteres"
              className={inputCls}
            />
          </div>
        </div>

        <div className="mb-2 flex items-center justify-between">
          <label className="text-xs font-bold text-[#aab3cf] uppercase tracking-wider">Pantallas con acceso</label>
          {screensDisabled && (
            <span className="text-[11px] text-fuchsia-300 font-semibold">El superadministrador accede a todo</span>
          )}
        </div>
        <div className={cn("space-y-4 rounded-xl border border-[#2a2a4a] bg-white/5 p-4", screensDisabled && "opacity-40 pointer-events-none")}>
          {grouped.map(([group, items]) => (
            <div key={group}>
              <p className="text-[10px] font-black uppercase tracking-widest text-[#8892b0] mb-2">{group}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {items.map((s) => (
                  <label
                    key={s.key}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 bg-white/5 border border-[#2a2a4a] cursor-pointer hover:border-[#0094ff] transition-all"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(s.key)}
                      onChange={() => toggle(s.key)}
                      className="accent-[#0094ff] h-4 w-4"
                    />
                    <span className="text-sm font-semibold text-white">{s.title}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl bg-white/5 text-[#c0c8de] hover:text-white font-bold transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving}
            className="flex items-center gap-2 bg-[#0094ff] hover:bg-[#00e1ff] text-white px-5 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {isEdit ? "Guardar cambios" : "Crear usuario"}
          </button>
        </div>
      </div>
    </div>
  );
}
