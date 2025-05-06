import { createContext } from 'react';
import { WalletView, WalletMainViewTab } from '../lib/constants';
import { GlyphViewType } from '../types';

interface GlyphViewContextType {
  glyphView: GlyphViewType;
  setGlyphView: React.Dispatch<React.SetStateAction<GlyphViewType>>;
  walletView: WalletView;
  setWalletView: React.Dispatch<React.SetStateAction<WalletView>>;
  walletMainViewTab: WalletMainViewTab;
  setWalletMainViewTab: React.Dispatch<React.SetStateAction<WalletMainViewTab>>;
}

export const GlyphViewContext = createContext<GlyphViewContextType | undefined>(undefined);
GlyphViewContext.displayName = "GlyphViewContext";
