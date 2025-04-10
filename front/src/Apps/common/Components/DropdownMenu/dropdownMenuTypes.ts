export interface ButtonElementProps {
  id: string;
  disabled?: boolean;
  onClick: () => void;
  isOpen: boolean;
  menuTitle: string;
}

export interface DropdownMenuProps {
  links: {
    title: string;
    route?: string | { pathname: string; search?: string };
    state?: object;
    icon?: React.ReactNode;
    iconId?: string;
    isButton?: boolean;
    isVisible?: boolean;
    handleClick?: (
      event: React.MouseEvent<HTMLButtonElement, MouseEvent>
    ) => void;
  }[];
  menuTitle: string;
  ButtonElement?: React.ComponentType<ButtonElementProps>;
  isDisabled?: boolean;
  iconAlone?: boolean;
  primary?: boolean;
  iconId?: string;
  alignRight?: boolean;
}
