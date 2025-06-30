FROM node:24-bookworm

ARG TZ
ENV TZ="$TZ"

# Install development tools and dependencies
RUN apt update && apt install -y \
    less git procps sudo fzf zsh man-db unzip \
    gnupg2 gh iptables ipset iproute2 dnsutils aggregate jq \
    build-essential python3 python3-pip \
    && apt clean && rm -rf /var/lib/apt/lists/*

# Install Claude Code from npm
RUN npm install -g @anthropic-ai/claude-code

# Set up npm global directory
RUN mkdir -p /usr/local/share/npm-global && \
    chown -R node:node /usr/local/share/npm-global

# Persist bash history
RUN mkdir /commandhistory && \
    touch /commandhistory/.bash_history && \
    chown -R node /commandhistory

ENV DEVCONTAINER=true

# Create workspace directories
RUN mkdir -p /workspace /home/node/.claude && \
    chown -R node:node /workspace /home/node/.claude

# Grant sudo access to node user
RUN echo "node ALL=(ALL) NOPASSWD:ALL" >> /etc/sudoers

# Install git-delta for better diffs
RUN ARCH=$(dpkg --print-architecture) && \
    wget "https://github.com/dandavison/delta/releases/download/0.18.2/git-delta_0.18.2_${ARCH}.deb" && \
    sudo dpkg -i "git-delta_0.18.2_${ARCH}.deb" && \
    rm "git-delta_0.18.2_${ARCH}.deb"

USER node

# Configure npm and PATH
ENV NPM_CONFIG_PREFIX=/usr/local/share/npm-global
ENV PATH=$PATH:/usr/local/share/npm-global/bin
ENV SHELL=/bin/zsh

# Install Oh My Zsh
RUN sh -c "$(wget -O- https://raw.githubusercontent.com/ohmyzsh/ohmyzsh/master/tools/install.sh)" "" --unattended

# Install additional Oh My Zsh plugins
RUN git clone https://github.com/zsh-users/zsh-autosuggestions ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-autosuggestions && \
    git clone https://github.com/zsh-users/zsh-syntax-highlighting.git ${ZSH_CUSTOM:-~/.oh-my-zsh/custom}/plugins/zsh-syntax-highlighting

# Configure .zshrc
RUN echo 'export ZSH="$HOME/.oh-my-zsh"' > ~/.zshrc && \
    echo 'ZSH_THEME="robbyrussell"' >> ~/.zshrc && \
    echo 'plugins=(git npm node docker fzf zsh-autosuggestions zsh-syntax-highlighting)' >> ~/.zshrc && \
    echo 'source $ZSH/oh-my-zsh.sh' >> ~/.zshrc && \
    echo 'source /usr/share/doc/fzf/examples/key-bindings.zsh' >> ~/.zshrc && \
    echo 'source /usr/share/doc/fzf/examples/completion.zsh' >> ~/.zshrc && \
    echo 'HISTFILE=/commandhistory/.zsh_history' >> ~/.zshrc && \
    echo 'export PATH=$PATH:/usr/local/share/npm-global/bin' >> ~/.zshrc

# Configure git
RUN git config --global core.pager delta && \
    git config --global interactive.diffFilter "delta --color-only" && \
    git config --global delta.navigate true && \
    git config --global delta.light false && \
    git config --global delta.side-by-side true && \
    git config --global merge.conflictstyle diff3 && \
    git config --global diff.colorMoved default

# Set up Claude Code aliases and additional configurations
RUN echo "" >> ~/.zshrc && \
    echo "# Claude Code alias" >> ~/.zshrc && \
    echo "alias cc='claude'" >> ~/.zshrc && \
    echo "" >> ~/.zshrc && \
    echo "# Ensure we're in the workspace directory" >> ~/.zshrc && \
    echo "cd /workspace" >> ~/.zshrc && \
    echo "" >> ~/.zshrc && \
    echo "# Welcome message" >> ~/.zshrc && \
    echo 'echo "🚀 CRO.CAFE Claude Code Environment"' >> ~/.zshrc && \
    echo 'echo "Run \"claude auth\" to authenticate if needed"' >> ~/.zshrc && \
    echo 'echo ""' >> ~/.zshrc

# Expose common development ports
EXPOSE 3000 4321 5173 8080

# Set working directory
WORKDIR /workspace

CMD ["/bin/zsh"]