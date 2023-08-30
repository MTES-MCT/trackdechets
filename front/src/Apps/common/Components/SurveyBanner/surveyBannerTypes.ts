export interface SurveyBannerProps {
  button: { title: string; href: string };
  message: string;
  onClickClose?: () => void;
}
