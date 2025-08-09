import { useMemo, useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/hooks/use-toast";

type Task = {
  TaskID: string;
  CandidateName: string;
  OffDays?: string[];
  IsOffToday?: boolean;
};

const dayMap = ["SUN","MON","TUE","WED","THU","FRI","SAT"] as const;

const ProgressBar = ({ loading }: { loading: boolean }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    if (loading) {
      setWidth(35);
    } else if (width > 0) {
      setWidth(100);
      const t = setTimeout(() => setWidth(0), 350);
      return () => clearTimeout(t);
    }
  }, [loading]);
  return (
    <div className="fixed left-0 right-0 top-0 z-50 h-1 bg-transparent">
      <div
        className="h-full bg-gradient-to-r from-primary to-accent transition-[width] duration-300"
        style={{ width: `${width}%` }}
        aria-hidden
      />
    </div>
  );
};

const TaskRow = ({ task, type, onComplete, onUndo }: { task: Task; type: "open" | "done"; onComplete: (id: string)=>void; onUndo: (id: string)=>void; }) => {
  return (
    <div className="flex items-center justify-between rounded-lg border bg-background p-4 transition-shadow hover:shadow-sm animate-fade-in">
      <div className="min-w-0 pr-4">
        <div className="flex items-center gap-2">
          {task.IsOffToday && <span className="inline-block h-2 w-2 rounded-full bg-destructive animate-pulse" aria-label="Off today" />}
          <p className="truncate font-medium">{task.CandidateName || "Unnamed task"}</p>
        </div>
        {task.OffDays && task.OffDays.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {task.OffDays.map((d) => (
              <Badge key={d} variant="secondary">{d}</Badge>
            ))}
          </div>
        )}
      </div>
      {type === "open" ? (
        <Button variant="success" size="sm" onClick={() => onComplete(task.TaskID)}>Complete</Button>
      ) : (
        <Button variant="ghost" size="sm" onClick={() => onUndo(task.TaskID)}>Undo</Button>
      )}
    </div>
  );
};

const Index = () => {
  // Demo data and local interactions (ready to wire to Apps Script later)
  const [openTasks, setOpenTasks] = useState<Task[]>([]);
  const [doneTasks, setDoneTasks] = useState<Task[]>([]);
  const [loadingOpen, setLoadingOpen] = useState(true);
  const [loadingDone, setLoadingDone] = useState(true);
  const [busy, setBusy] = useState(false);

  // Admin state
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminPass, setAdminPass] = useState("");

  // Create flow
  const [step, setStep] = useState<1|2|3>(1);
  const [candName, setCandName] = useState("");
  const [category, setCategory] = useState("Ramp Check");
  const [customCat, setCustomCat] = useState("");
  const [selectedDays, setSelectedDays] = useState<string[]>([]);

  const todayDay = useMemo(() => dayMap[new Date().getDay()], []);

  useEffect(() => {
    // seed demo tasks
    const demoOpen: Task[] = [
      { TaskID: "T_001", CandidateName: "Alex Johnson", OffDays: ["MON","THU","SAT"], IsOffToday: ["MON","THU","SAT"].includes(todayDay) },
      { TaskID: "T_002", CandidateName: "Maya Patel", OffDays: ["SUN","TUE","FRI"], IsOffToday: ["SUN","TUE","FRI"].includes(todayDay) },
    ];
    const demoDone: Task[] = [
      { TaskID: "T_003", CandidateName: "Chris Lee", OffDays: ["WED","SAT","SUN"], IsOffToday: ["WED","SAT","SUN"].includes(todayDay) },
    ];
    const t1 = setTimeout(() => { setOpenTasks(demoOpen); setLoadingOpen(false); }, 500);
    const t2 = setTimeout(() => { setDoneTasks(demoDone); setLoadingDone(false); }, 700);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [todayDay]);

  const refreshOpen = () => {
    setLoadingOpen(true); setBusy(true);
    setTimeout(() => { setLoadingOpen(false); setBusy(false); toast({ title: "Open tasks refreshed" }); }, 700);
  };
  const refreshDone = () => {
    setLoadingDone(true); setBusy(true);
    setTimeout(() => { setLoadingDone(false); setBusy(false); toast({ title: "Completed refreshed" }); }, 700);
  };

  const completeTask = (id: string) => {
    setBusy(true);
    setOpenTasks((prev) => {
      const idx = prev.findIndex(t => t.TaskID === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      const [task] = copy.splice(idx, 1);
      setDoneTasks((d) => [task, ...d]);
      return copy;
    });
    setTimeout(() => { setBusy(false); toast({ title: "Task completed" }); }, 300);
  };

  const undoTask = (id: string) => {
    setBusy(true);
    setDoneTasks((prev) => {
      const idx = prev.findIndex(t => t.TaskID === id);
      if (idx === -1) return prev;
      const copy = [...prev];
      const [task] = copy.splice(idx, 1);
      setOpenTasks((d) => [task, ...d]);
      return copy;
    });
    setTimeout(() => { setBusy(false); toast({ title: "Task moved back to open" }); }, 300);
  };

  const openCount = openTasks.length;
  const doneCount = doneTasks.length;

  const onAdminLogin = () => {
    if (adminPass.trim() === "11143") {
      setIsAdmin(true);
      toast({ title: "Welcome, Admin" });
    } else {
      toast({ title: "Incorrect password", description: "Please try again.", });
    }
  };

  const createTask = () => {
    const name = candName.trim();
    const cat = category === "__custom__" ? customCat.trim() : category;
    if (!name) { toast({ title: "Enter candidate name" }); return; }
    if (!cat) { toast({ title: "Select a category" }); return; }
    if (selectedDays.length < 3) { toast({ title: "Pick at least 3 off days" }); return; }

    const task: Task = {
      TaskID: `T_${Date.now()}`,
      CandidateName: name,
      OffDays: selectedDays,
      IsOffToday: selectedDays.includes(todayDay)
    };
    setOpenTasks((prev) => [task, ...prev]);
    setStep(1);
    setCandName("");
    setCategory("Ramp Check");
    setCustomCat("");
    setSelectedDays([]);
    toast({ title: "Task created" });
  };

  const DayCheckbox = ({ value }: { value: string }) => (
    <div className="flex items-center gap-2 rounded-md border p-2">
      <Checkbox id={`day-${value.toLowerCase()}`} checked={selectedDays.includes(value)} onCheckedChange={(v) => {
        const checked = Boolean(v);
        setSelectedDays((prev) => checked ? [...prev, value] : prev.filter(d => d !== value));
      }} />
      <Label htmlFor={`day-${value.toLowerCase()}`}>{value}</Label>
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ProgressBar loading={busy || loadingOpen || loadingDone} />
      <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <h1 className="text-2xl font-bold">Cabin Crew Task Manager</h1>
          <p className="mt-1 text-sm text-muted-foreground">Streamlined task management</p>
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 pb-16 pt-6">
        <Tabs defaultValue="user" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger className="flex-1" value="user">User</TabsTrigger>
            <TabsTrigger className="flex-1" value="admin">Admin</TabsTrigger>
          </TabsList>

          <TabsContent value="user">
            <div className="space-y-6">
              <Card className="animate-enter">
                <CardHeader className="flex items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold">Open Tasks <Badge variant="secondary" className="ml-2">Open</Badge></CardTitle>
                  <Button variant="ghost" size="sm" onClick={refreshOpen}>Refresh</Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {loadingOpen ? (
                      <>
                        <Skeleton className="h-14 w-full" />
                        <Skeleton className="h-14 w-full" />
                      </>
                    ) : openTasks.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No open tasks</p>
                    ) : (
                      openTasks.map((t) => (
                        <TaskRow key={t.TaskID} task={t} type="open" onComplete={completeTask} onUndo={undoTask} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="animate-enter">
                <CardHeader className="flex items-center justify-between space-y-0">
                  <CardTitle className="text-base font-semibold">Completed <Badge className="ml-2">Done</Badge></CardTitle>
                  <Button variant="ghost" size="sm" onClick={refreshDone}>Refresh</Button>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-col gap-3">
                    {loadingDone ? (
                      <Skeleton className="h-14 w-full" />
                    ) : doneTasks.length === 0 ? (
                      <p className="py-6 text-center text-sm text-muted-foreground">No completed tasks</p>
                    ) : (
                      doneTasks.map((t) => (
                        <TaskRow key={t.TaskID} task={t} type="done" onComplete={completeTask} onUndo={undoTask} />
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="admin">
            {!isAdmin ? (
              <Card className="animate-scale-in">
                <CardHeader>
                  <CardTitle className="text-base">Admin Access</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex w-full items-end gap-2">
                    <div className="flex-1">
                      <Label htmlFor="admin-pass">Password</Label>
                      <Input id="admin-pass" type="password" inputMode="numeric" value={adminPass} onChange={(e) => setAdminPass(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter') onAdminLogin(); }} />
                    </div>
                    <Button variant="hero" onClick={onAdminLogin}>Login</Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                <Card className="animate-enter">
                  <CardHeader>
                    <CardTitle className="text-base">Create New Task</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {step === 1 && (
                      <div className="space-y-3">
                        <div>
                          <Label htmlFor="cand">Candidate Name</Label>
                          <Input id="cand" placeholder="Type candidate name" value={candName} onChange={(e) => setCandName(e.target.value)} />
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                          <Button className="flex-1" onClick={() => {
                            if (!candName.trim()) { toast({ title: "Please enter candidate name" }); return; }
                            setStep(2);
                          }}>Continue</Button>
                        </div>
                      </div>
                    )}

                    {step === 2 && (
                      <div className="space-y-3">
                        <div>
                          <Label>Category</Label>
                          <Select value={category} onValueChange={(v) => setCategory(v)}>
                            <SelectTrigger>
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Ramp Check">Ramp Check</SelectItem>
                              <SelectItem value="Line Check">Line Check</SelectItem>
                              <SelectItem value="Grooming Check">Grooming Check</SelectItem>
                              <SelectItem value="__custom__">Custom</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        {category === "__custom__" && (
                          <div>
                            <Label htmlFor="custom">Custom category</Label>
                            <Input id="custom" placeholder="Enter custom category" value={customCat} onChange={(e) => setCustomCat(e.target.value)} />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <Button variant="secondary" className="flex-1" onClick={() => setStep(1)}>Back</Button>
                          <Button className="flex-1" onClick={() => {
                            if (category === "__custom__" && !customCat.trim()) { toast({ title: "Please enter custom category" }); return; }
                            setStep(3);
                          }}>Continue</Button>
                        </div>
                      </div>
                    )}

                    {step === 3 && (
                      <div className="space-y-3">
                        <Label>Select Off Days (min 3)</Label>
                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                          {dayMap.map((d) => (
                            <DayCheckbox key={d} value={d} />
                          ))}
                        </div>
                        <div className="flex gap-2">
                          <Button variant="secondary" className="flex-1" onClick={() => setStep(2)}>Back</Button>
                          <Button variant="success" className="flex-1" onClick={createTask}>Create Task</Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="animate-enter">
                  <CardHeader>
                    <CardTitle className="text-base">Dashboard</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="rounded-md border p-3 text-center font-medium">Open: {openCount}</div>
                      <div className="rounded-md border p-3 text-center font-medium">Done: {doneCount}</div>
                      <Button variant="ghost" onClick={() => { toast({ title: "Dashboard refreshed" }); }}>Refresh</Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="animate-enter">
                  <CardHeader className="flex items-center justify-between space-y-0">
                    <CardTitle className="text-base">Open Tasks</CardTitle>
                    <Button variant="ghost" size="sm" onClick={refreshOpen}>Refresh</Button>
                  </CardHeader>
                  <CardContent>
                    <div className="flex flex-col gap-3">
                      {loadingOpen ? (
                        <>
                          <Skeleton className="h-14 w-full" />
                          <Skeleton className="h-14 w-full" />
                        </>
                      ) : openTasks.length === 0 ? (
                        <p className="py-6 text-center text-sm text-muted-foreground">No open tasks</p>
                      ) : (
                        openTasks.map((t) => (
                          <div key={t.TaskID} className="flex items-center justify-between rounded-lg border bg-background p-4">
                            <div className="min-w-0">
                              <p className="truncate font-medium">{t.CandidateName}</p>
                              {t.OffDays && t.OffDays.length > 0 && (
                                <div className="mt-1 flex flex-wrap gap-1">
                                  {t.OffDays.map((d) => (<Badge key={d} variant="secondary">{d}</Badge>))}
                                </div>
                              )}
                            </div>
                            <Button variant="destructive" size="sm" onClick={() => {
                              // Admin delete
                              setOpenTasks((prev) => prev.filter(x => x.TaskID !== t.TaskID));
                              toast({ title: "Task deleted" });
                            }}>Delete</Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>

        <footer className="mt-10 text-center text-xs text-muted-foreground">Developed by AFKA</footer>
      </main>
    </div>
  );
};

export default Index;
