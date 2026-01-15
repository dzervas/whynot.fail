{ pkgs, ... }: {
  languages = {
    javascript = {
      enable = true;
      npm.enable = true;
    };
  };

  packages = with pkgs; [
    tailwindcss
  ];
}
