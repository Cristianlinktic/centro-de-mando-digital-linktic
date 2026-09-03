import { Analyst } from "@/components/instagram/Analyst";

export default function ActoresElectoralesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <Analyst />
    </>
  );
}
