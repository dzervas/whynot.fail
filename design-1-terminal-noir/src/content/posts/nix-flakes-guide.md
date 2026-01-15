---
title: "Getting Started with Nix Flakes"
date: 2024-08-10
tags: ["nix", "linux", "devops"]
build_status: "passing"
writer: "dzervas"
description: "A practical guide to Nix Flakes that won't make you cry (probably)"
---

For the past month I've been transitioning to NixOS, both my work laptop and my personal desktop. It's been an amazing voyage with a steep learning curve for the first 1-2 days.

## What are Flakes?

Flakes are Nix's answer to reproducibility. Think of them as `package.json` but for your entire system. Here's a minimal flake:

```nix
{
  description = "My awesome flake";

  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
  };

  outputs = { self, nixpkgs }: {
    # Your outputs here
  };
}
```

> [!NOTE]
> Flakes are still technically "experimental" but everyone uses them. Enable with `experimental-features = nix-command flakes` in your nix.conf.

## Setting Up Your First Flake

Create a `flake.nix` in your project root:

```bash
# Initialize a new flake
nix flake init

# Or use a template
nix flake init -t templates#full
```

The structure is straightforward once you get past the initial confusion:

```nix
{
  inputs = {
    nixpkgs.url = "github:NixOS/nixpkgs/nixos-unstable";
    home-manager = {
      url = "github:nix-community/home-manager";
      inputs.nixpkgs.follows = "nixpkgs";
    };
  };

  outputs = { self, nixpkgs, home-manager, ... }@inputs: {
    nixosConfigurations.myhost = nixpkgs.lib.nixosSystem {
      system = "x86_64-linux";
      modules = [
        ./configuration.nix
        home-manager.nixosModules.home-manager
      ];
    };
  };
}
```

> [!WARNING]
> Don't forget to add `flake.lock` to your git repo! It pins your dependencies.

## Development Shells

One of the killer features is per-project development environments:

```nix
{
  outputs = { nixpkgs, ... }: {
    devShells.x86_64-linux.default = nixpkgs.legacyPackages.x86_64-linux.mkShell {
      packages = with nixpkgs.legacyPackages.x86_64-linux; [
        python3
        nodejs
        rustc
        cargo
      ];
      
      shellHook = ''
        echo "Welcome to the dev shell!"
      '';
    };
  };
}
```

Then just run:

```bash
nix develop
```

> [!INFO]
> You can also use `direnv` with `use flake` to automatically enter the shell when you `cd` into the directory.

## Common Gotchas

Here's a table of things that tripped me up:

| Problem | Solution |
|---------|----------|
| "flake not found" | Run `git add flake.nix` first |
| Slow evaluation | Use `--accept-flake-config` |
| Missing packages | Check if you're on the right nixpkgs branch |

> [!DANGER]
> Never run `nix-collect-garbage -d` without checking what generations you're deleting. You might remove a working config!

## Conclusion

Flakes changed how I think about system configuration. The initial investment pays off massively when you realize your entire setup is version-controlled and reproducible.

My config is available at [github.com/dzervas/dotfiles](https://github.com/dzervas/dotfiles) if you want to steal some ideas.
