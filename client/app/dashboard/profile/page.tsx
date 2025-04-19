"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentUser } from '@/hooks/use-user'
import { getSession } from '@/lib/session'
import { User } from '@/types/user'
import { MoreVertical, Plus } from 'lucide-react'
import React, { useEffect, useState } from 'react'

const ProfilePage = () => {

  const user = useCurrentUser();
  const [userData, setUserData] = useState<User | undefined>(undefined);

  useEffect(() => {
    (async () => {
      const session = await getSession()
      const data = await fetch('http://localhost:3001/api/users/me/' + user?.id, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.value}`,
        },
        credentials: "include",
      });
      const userData = await data.json();
      console.log(userData);
      setUserData(userData);
    })()

  }, [user])


  if(!user) return null;

  return (
    <div className="flex flex-1 flex-col items-center p-8">
      <h1 className="text-3xl font-bold mb-8">Profile</h1>
      
      <Card className="max-w-xl w-full">
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-6">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Name</label>
            <div className="text-lg">{user?.name}</div>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Username</label>
            <div className="text-lg">{user?.username}</div>
          </div>
        </CardContent>
      </Card>
      <Card className='max-w-xl w-full mt-8'>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>Devices ({userData?.PassKey?.length})</CardTitle>
          <Button variant="outline"><Plus /></Button>
        </CardHeader>
        <CardContent className="grid gap-6">
          {userData?.PassKey?.map((device) => (
            <div className="flex gap-1 justify-between items-center" key={device.id}>
              <div className="text-lg">{device.name}</div>
              <div className='flex gap-1 items-center'>
                <div>
                  {device.back_up ? (
                    <span className="text-green-500">Backup</span>
                  ) : (
                    <span className="text-red-500">Not Backup</span>
                  )}
                </div>
                <Button variant="ghost"><MoreVertical /></Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
