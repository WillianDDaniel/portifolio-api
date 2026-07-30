interface HeadingProps {
  level: number;
  icon?: string;
  title: string;
}

export default function Heading({ level, icon, title }: HeadingProps) {
  const render = () => {
    switch (level) {
      case 1:
        return (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {title}
          </h1>
        );
      case 2:
        return (
          <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-100 flex items-center gap-2">
            {icon && <span className="text-xl">{icon}</span>}
            {title}
          </h2>
        );
      case 3:
        return (
          <h3 className="text-lg font-medium text-gray-700 dark:text-gray-200 flex items-center gap-2">
            {icon && <span className="text-lg">{icon}</span>}
            {title}
          </h3>
        );
      default:
        return (
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            {icon && <span className="text-2xl">{icon}</span>}
            {title}
          </h1>
        );
    }
  };

  return render();
}
