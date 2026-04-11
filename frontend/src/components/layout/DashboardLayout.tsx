import TopBar from "@/components/layout/TopBar";
import ScheduleGrid from "@/components/schedule/ScheduleGrid";
import SubjectsList from "@/components/subjects/SubjectsList";
import MessagesList from "@/components/messages/MessagesList";
import NewsList from "@/components/news/NewsList";

export default function Dashboard() {
  return (
    <div className="h-screen flex flex-col">
      <TopBar />

      <div className="flex flex-1 gap-4 p-4">
        {/* LEWA CZĘŚĆ */}
        <div className="flex flex-col flex-[4] gap-4">
          {/* PLAN */}
          <div className="flex-[2] border rounded p-2 overflow-auto">
            <ScheduleGrid />
          </div>

          {/* DÓŁ */}
          <div className="flex flex-[1] gap-4">
            <div className="flex-1">
              <NewsList />
            </div>

            <div className="flex-1">
              <MessagesList />
            </div>
          </div>
        </div>

        {/* PRAWA KOLUMNA (WĄSKA) */}
        <div className="flex-[1] max-w-[20%]">
          <SubjectsList />
        </div>
      </div>
    </div>
  );
}