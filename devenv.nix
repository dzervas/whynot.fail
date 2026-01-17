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

  env = {
    PLANE_API_BASE_URL = "https://projects.vpn.dzerv.art/api";
    PLANE_WORKSPACE_SLUG = "personal";
    PLANE_PROJECT_ID = "32980ecb-00f3-448e-b2f0-7b68b4647711";
    API_TOKEN = "op://secrets/blog-plane-api/password";
  };
}
