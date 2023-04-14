export interface DropdownMenuProps {
  links: { title: string; route: string; icon?: React.ReactNode }[];
  menuTitle: string;
  isDisabled?: boolean;
}
