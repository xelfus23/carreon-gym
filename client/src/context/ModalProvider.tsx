// context/ModalProvider.tsx
import { createContext, useContext, useState, ReactNode } from 'react';
import SubscriptionModal from '../app/components/Modals/SubscriptionModal';
import InstructionsModal from '../app/components/Modals/InstructionsModal';

export type cartProps = {
  transactionType?: "plan" | "product";
  itemName?: string;
  amount?: string;
  quantity?: string;
  planId?: string;
  planName?: string;
  productId?: string;
  items?: string;
}

interface SubscriptionModalContextType {
  subscription: {
    hide: () => void;
    show: () => void;
  };
  instructions: {
    hide: () => void;
    show: () => void;
  };
}

const SubscriptionModalContext = createContext<SubscriptionModalContextType | null>(null);

export function ModalProvider({ children }: { children: ReactNode }) {
  const [subsVisible, setSubsVisible] = useState(false);
  const [insVisible, setInsVisible] = useState(false);
  const [params, setParams] = useState<cartProps>({});

  const handlePlanSelected = (v: cartProps) => {
    setParams(v);
    setSubsVisible(false);
    setInsVisible(true);
  };

  const handleInstructionsClose = () => {
    setInsVisible(false);
    setSubsVisible(false);
  };

  const handleBack = () => {
    setInsVisible(false)
    setSubsVisible(true)
  }

  const subscription = {
    hide: () => setSubsVisible(false),
    show: () => setSubsVisible(true),
  };

  const instructions = {
    hide: handleInstructionsClose,
    show: () => setInsVisible(true),
  };

  return (
    <SubscriptionModalContext.Provider value={{ subscription, instructions }}>
      {children}
      <SubscriptionModal
        visible={subsVisible}
        onClose={subscription.hide}
        setParams={handlePlanSelected}
      />
      <InstructionsModal
        params={params}
        visible={insVisible}
        onBack={handleBack}
        onClose={handleInstructionsClose}
      />
    </SubscriptionModalContext.Provider>
  );
}

export function useModal(): SubscriptionModalContextType {
  const context = useContext(SubscriptionModalContext);
  if (!context) throw new Error('useModal must be used within ModalProvider');
  return context;
}