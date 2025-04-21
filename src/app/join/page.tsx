import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import JoinStudyGroup from "@/components/join-study-group";

export const dynamic = "force-dynamic";


export default async function JoinPage({
  searchParams,
}: {
  searchParams: { code?: string };
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // We don't redirect unauthenticated users here because the component
  // will handle redirecting them to sign in if needed

  return (
    <div className="flex-1 flex flex-col w-full px-8 sm:max-w-md justify-center gap-2 mx-auto">
      <div className="py-10">
        <h1 className="text-2xl font-bold mb-4 text-center">Join a Study Group</h1>
        <JoinStudyGroup code={searchParams.code} />
      </div>
    </div>
  );
}
