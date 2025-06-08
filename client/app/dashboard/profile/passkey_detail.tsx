import { Passkey } from '@/types/user'
import React from 'react'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Edit, MoreVertical, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { getSession } from '@/lib/session'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'


const PasskeyDetail = ({ passkey } : {passkey: Passkey}) => {

  const [editing, setEditing] = React.useState(false)
  const [name, setName] = React.useState(passkey.name)

  const [error, setError] = React.useState('')

  const handleDelete = async () => {
    const session = await getSession()
    fetch(process.env.NEXT_PUBLIC_API_URL + '/passkeys/' + passkey.id, {
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${session?.value}`,
      },
      method: 'DELETE',
    }).then((res) => {
      if(res.ok) {
        window.location.reload();
      } else {
        if(res.status === 400) {
          setError('Cannot delete last passkey')
        } else {
          setError('Delete failed')
          console.error('Delete failed', res.status);
        }
      }
    })
  }

  const onEdit = () => {
    setEditing(true)
  }

  const handleEdit = async () => {
    try {
      const session = await getSession()
      const response  = await fetch(process.env.NEXT_PUBLIC_API_URL + '/passkeys/' + passkey.id, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session?.value}`,
        },
        credentials: 'include',
        body: JSON.stringify({ device_name: name }),
      })
      if (response.ok) {
        setEditing(false)
        passkey.name = name
      }
    } catch (error) {
      console.error('Edit failed', error);
    }
  }

  return (
    <div className="flex items-center justify-between gap-1" key={passkey.id}>
      {editing ? (
        <>
          <Input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <Button type="button" variant="default" onClick={handleEdit}>
            Save
          </Button>
          <Button type="button" variant="secondary" onClick={() => setEditing(false)}>
            Cancel
          </Button>
        </>
      ) : (
        <>
          <div className="text-lg">{passkey.name}</div>
          <div className='flex items-center gap-1'>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreVertical />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={onEdit}>
                    <Edit />
                    Edit name
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <Dialog>
                  <DialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()} variant="destructive">
                      <Trash2 />
                      Delete
                    </DropdownMenuItem>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Delete device</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-4 py-4">
                      <span className="text-sm text-destructive">{error}</span>
                      <p>Are you sure you want to delete {passkey.name}?</p>
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type="button" variant="secondary">
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button variant="destructive" onClick={handleDelete}>Delete</Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </>
      )}
      
    </div>
  )
}

export default PasskeyDetail