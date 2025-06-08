"use client"

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { useCurrentUser } from '@/hooks/use-user'
import { getSession } from '@/lib/session'
import { User } from '@/types/user'
import React, { useEffect, useState } from 'react'
import PasskeyDetail from './passkey_detail'
import { createNewDevice } from '@/services/auth.service'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus } from 'lucide-react'

const ProfilePage = () => {

  const user = useCurrentUser();
  const [userData, setUserData] = useState<User | undefined>(undefined);
  const [error, setError] = useState('')

  useEffect(() => {
    (async () => {
      if(!user) return;
      const session = await getSession()
      const data = await fetch(process.env.NEXT_PUBLIC_API_URL + '/users/me/' + user?.id, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.value}`,
        },
        credentials: "include",
      });
      const userData = await data.json();
      
      setUserData(userData);
    })()
  }, [user])

  const [deviceName, setDeviceName] = useState('')  

  const handleAddDevice = async () => {
    try{
      await createNewDevice({
        username: user?.username || '',
        deviceName: deviceName,
      }).then((response) => {
        if(response) {
          window.location.reload();
        } else {
          setError('Creation failed')
        }
      })
    } catch (error) {
      if(error instanceof Error) {
        setError(error.message)
      }
      setError('Creating failed')
      console.error('Registration failed', error);
    }
  }


  if(!user) return null;

  return (
    <div className="flex flex-col items-center flex-1 p-8">
      <h1 className="mb-8 text-3xl font-bold">Profile</h1>
      
      <Card className="w-full max-w-xl">
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
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium text-muted-foreground">Email</label>
            <div className="text-lg">{user?.email}</div>
          </div>
        </CardContent>
      </Card>
      <Card className='w-full max-w-xl mt-8'>
        <CardHeader className="flex items-center justify-between">
          <CardTitle>Devices ({userData?.PassKey?.length})</CardTitle>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline"><Plus /></Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Add Device</DialogTitle>
              </DialogHeader>
              <div className="flex flex-col gap-4 py-4">
                <span className="text-sm text-destructive">{error}</span>
                <Label htmlFor="name" className="text-right">
                  Device name
                </Label>
                <Input
                  id="name"
                  value={deviceName}
                  onChange={(e) => setDeviceName(e.target.value)}
                  className="col-span-3"
                />
              </div>
              <DialogFooter>
                <Button onClick={handleAddDevice}>Save</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent className="grid gap-6">
          {userData?.PassKey?.map((device) => (
            <PasskeyDetail passkey={device} key={device.id} />
          ))}
        </CardContent>
      </Card>
    </div>
  )
}

export default ProfilePage
