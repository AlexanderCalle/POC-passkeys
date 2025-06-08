import { getSession } from "@/lib/session";
import { User } from "@/types/user";
import { useEffect, useState } from "react";

export const useCurrentUser = () => {
  const [user, setUser] = useState<User | undefined>(undefined);

  useEffect(() => {
    const fetchUser = async () => {
      const session = await getSession();
      if(!session) return;
      const response = await fetch(process.env.NEXT_PUBLIC_API_URL + '/auth/verify', {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.value}`,
        },
        credentials: "include",
      });
      const data = await response.json();
      setUser(data.user);
    };

    fetchUser();
  }, []);

  return user;
}