export default function Dashboard() {
  return (
    <div className="h-screen flex flex-col bg-white">
      <TopBar />

      <div className="flex flex-1 gap-4 p-2">
        <div className="flex flex-col flex-[4] gap-4">
          <div className="flex-[2] border rounded p-1 overflow-auto">
            <ScheduleGrid />
          </div>

          <div className="flex flex-[1] gap-4">
            <div className="flex-1">
              <NewsList />
            </div>

            <div className="flex-1">
              <MessagesList />
            </div>
          </div>
        </div>

        <div className="flex-[1] max-w-[20%] pr-2">
          <SubjectsList />
        </div>
      </div>
    </div>
  );
}