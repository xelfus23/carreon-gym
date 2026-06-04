import { useCallback, useEffect, useState } from "react";
import { memberService } from "../services/member.service";
import type { UserAccountProps } from "../types";

export const useMember = () => {
  const [members, setMembers] = useState<UserAccountProps[]>([]);
  const [admins, setAdmins] = useState<UserAccountProps[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    try {
      const result = await memberService.getMember();

      setMembers(
        result.data?.filter((v: UserAccountProps) => v.role !== "admin") ?? [],
      );
      setAdmins(
        result.data?.filter((v: UserAccountProps) => v.role !== "member") ?? [],
      );
    } catch (err) {
      if (err instanceof Error) console.error("Fetch error:", err.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const createAccount = async (data: Partial<UserAccountProps>) => {
    try {
      await memberService.createMember(data);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Verify error:", err.message);
    }
  };

  const verifyAccount = async (memberId: number) => {
    try {
      await memberService.verifyAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Verify error:", err.message);
    }
  };

  const suspendAccount = async (memberId: number) => {
    try {
      await memberService.suspendAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Suspend error:", err.message);
    }
  };

  const deleteAccount = async (memberId: number) => {
    try {
      await memberService.deleteAccount(memberId);
      await refetch();
    } catch (err) {
      if (err instanceof Error) console.error("Delete error:", err.message);
    }
  };

  const banAccount = async (memberId: number) => {
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
    verifyAccount,
    createAccount,
    suspendAccount,
    deleteAccount,
    banAccount,
    isLoading,
  };
};
