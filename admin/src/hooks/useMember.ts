import { useCallback, useEffect, useState } from "react";
import { memberService } from "../services/member.service";
import type { AdminMemberListItem } from "../types";

export const useMember = () => {
  const [members, setMembers] = useState<AdminMemberListItem[]>([]);
  const [admins, setAdmins] = useState<AdminMemberListItem[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await memberService.getMember();
      setMembers(
        result.data.filter((v: AdminMemberListItem) => v.role !== "admin") ??
        [],
      );
      setAdmins(
        result.data.filter((v: AdminMemberListItem) => v.role !== "member") ??
        [],
      );
    } catch (err) {
      if (err instanceof Error) console.log(err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const verifyMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      await memberService.verifyAccount(memberId);
      refetch();
    } catch (err) {
      if (err instanceof Error) console.log(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteMember = async (memberId: number) => {
    setIsLoading(true);
    try {
      await memberService.deleteAccount(memberId)
      refetch();
    } catch (err) {
      if (err instanceof Error) console.log(err.message);
    } finally {
      setIsLoading(false);

    }
  }

  useEffect(() => {
    let cancelled = false;

    const fetchMembers = async () => {
      setIsLoading(true);
      try {
        const result = await memberService.getMember();

        if (!cancelled) {
          setMembers(
            result.data.filter(
              (v: AdminMemberListItem) => v.role !== "admin",
            ) ?? [],
          );
          setAdmins(
            result.data.filter(
              (v: AdminMemberListItem) => v.role !== "member",
            ) ?? [],
          );
        }
      } catch (err) {
        if (err instanceof Error) console.log(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchMembers();

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    members,
    admins,
    refresh: refetch,
    verifyMember,
    deleteMember,
    isLoading,
  };
};
