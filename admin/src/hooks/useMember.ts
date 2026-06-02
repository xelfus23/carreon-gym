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
        result.data?.filter((v: AdminMemberListItem) => v.role !== "admin") ?? []
      );
      setAdmins(
        result.data?.filter((v: AdminMemberListItem) => v.role !== "member") ?? []
      );
    } catch (err) {
      if (err instanceof Error) console.error("Fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);


  const verifyMember = async (memberId: number) => {
    try {
      await memberService.verifyAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Verify error:", err.message);
    }
  };

  const suspendMember = async (memberId: number) => {
    try {
      await memberService.suspendAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Suspend error:", err.message);
    }
  };

  const deleteMember = async (memberId: number) => {
    try {
      await memberService.deleteAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Delete error:", err.message);
    }
  };

  const banMember = async (memberId: number) => {
    try {
      await memberService.banAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Ban error:", err.message);
    }
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    members,
    admins,
    refresh: refetch,
    verifyMember,
    suspendMember,
    deleteMember,
    banMember,
    isLoading,
  };
};