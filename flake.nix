{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    flake-parts.url = "github:hercules-ci/flake-parts";
  };

  outputs = { self, nixpkgs, flake-parts }@inputs:
    flake-parts.lib.mkFlake { inherit inputs; } ({ ... }: {
      systems = [ "x86_64-linux" "aarch64-linux" "x86_64-darwin" "aarch64-darwin" ];
      perSystem = { pkgs, ... }: let
        python = pkgs.python314.withPackages(ps: let
          django = ps.django_6;
          djangorestframework = ps.djangorestframework.override { inherit django; };
          dj-database-url = ps.dj-database-url.override { inherit django; };
        in [
          django
          djangorestframework
          (ps.djangorestframework-simplejwt.override {
            inherit django djangorestframework;
          })
          (ps.django-cors-headers.override { inherit django; })
          dj-database-url
        ]);
      in {
        devShells.default = pkgs.mkShell {
          packages = [
            python
            pkgs.pyright

            pkgs.nodejs_25
            pkgs.typescript-language-server
            pkgs.eslint
          ];
        };
      };
    });
}
