import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"
import { RolesTab } from "@/components/users/RolesTab"
import { UsersTab } from "@/components/users/UsersTab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { loadUsersAndRoles, type RoleRow, type StaffRow } from "@/lib/api/users"

export default function UsersAndRolesPage() {
  const [tab, setTab] = useState("users")
  const [staff, setStaff] = useState<StaffRow[]>([])
  const [roles, setRoles] = useState<RoleRow[]>([])
  const [counts, setCounts] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await loadUsersAndRoles()
      setStaff(data.staff)
      setRoles(data.roles)
      setCounts(data.counts)
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not load users and roles.")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  if (loading) return <div className="p-8 text-center text-muted-foreground">Loading users and roles...</div>

  return (
    <div className="flex min-w-0 flex-1 flex-col gap-4">
      <Tabs value={tab} onValueChange={(v) => setTab(String(v))} className="gap-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger className="w-full" value="users">
            Users
          </TabsTrigger>
          <TabsTrigger className="w-full" value="roles">
            Roles and permissions
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <UsersTab staff={staff} roles={roles} onChanged={load} />
        </TabsContent>

        <TabsContent value="roles">
          <RolesTab roles={roles} counts={counts} onChanged={load} onLocalChange={setRoles} />
        </TabsContent>
      </Tabs>
    </div>
  )
}