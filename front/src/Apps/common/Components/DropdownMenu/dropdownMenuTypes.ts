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
  isDisabled?: boolean;
  iconAlone?: boolean;
  primary?: boolean;
  iconId?: string;
}
