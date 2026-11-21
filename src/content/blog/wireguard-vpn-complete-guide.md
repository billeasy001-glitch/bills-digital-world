---
title: "从零搭建自己的 VPN 服务器：WireGuard 完整搭建与稳定性优化教程 | Complete WireGuard VPN Setup Guide"
description: "从 VPS 服务器选购、Ubuntu 初始化、SSH 连接，到 WireGuard 安装、客户端配置、握手验证、NAT、MTU 优化、速度测试和长期稳定性测试。A practical bilingual guide to deploying and optimizing WireGuard on Ubuntu."
category: "技术教程 / Technology"
date: 2026-11-22
draft: true
---

# 从零搭建自己的 VPN 服务器：WireGuard 完整搭建与稳定性优化教程

*Complete WireGuard VPN Setup Guide: From VPS Selection to Performance and Stability Testing*

> 本文基于真实服务器搭建和测试经验整理，同时补充标准化部署步骤。历史实测数据与通用配置示例会分别标注，方便读者复现和验证。
>
> This guide combines real deployment and testing experience with standardized configuration practices. Historical test results are distinguished from general configuration examples.

---

# 目录 | Contents

1. 项目介绍与网络架构 | Introduction and Architecture
2. VPS 服务器购买与选型 | VPS Selection
3. SSH 连接服务器 | Connecting via SSH
4. Ubuntu 初始化 | Ubuntu Initialization
5. 安装 WireGuard | Installing WireGuard
6. 生成密钥 | Key Generation
7. 配置服务端 | Server Configuration
8. 配置防火墙与安全组 | Firewall Configuration
9. 配置客户端 | Client Configuration
10. VPN 握手验证 | Handshake Verification
11. NAT 与网络转发 | NAT and IP Forwarding
12. MTU 与 TCPMSS 优化 | MTU and TCPMSS Optimization
13. 抓包分析 | Packet Capture
14. iperf3 速度测试 | Speed Testing
15. 长期稳定性测试 | Stability Testing
16. 开机自动启动 | Automatic Startup
17. 故障排查 | Troubleshooting
18. 配置备份与安全 | Backup and Security
19. 实际测试记录 | Real Test Results
20. 最终验收 | Final Checklist

---

# 01. 项目介绍与网络架构

## 1.1 为什么选择 WireGuard？

WireGuard 是一种现代化 VPN 协议，具有以下特点：

- 配置相对简单。
- 使用现代密码学技术。
- 运行效率较高。
- 支持 Windows、Linux、macOS、Android 和 iOS。
- 可以通过公钥和私钥管理不同客户端。
- 支持全局流量或指定流量通过 VPN。

WireGuard 不只是一个安装软件，它还涉及路由、IP 转发、防火墙和 NAT 配置。

WireGuard uses modern cryptography and a relatively simple peer-based configuration model. A successful installation alone does not guarantee internet connectivity. Routing, forwarding, firewall rules, and NAT must also be configured correctly.

## 1.2 整体架构

```text
             Windows / Android / iOS
                       |
                       |
                 WireGuard Client
                       |
                       |
                  UDP 51820
                       |
                       v
             +-------------------+
             |    VPS Server     |
             |                   |
             |  Public IPv4      |
             |                   |
             |  WireGuard wg0    |
             |  10.66.66.1       |
             |                   |
             |  IP Forwarding    |
             |  NAT MASQUERADE   |
             |  TCPMSS Clamp     |
             +-------------------+
                       |
                    ens17
                       |
                       v
                    Internet
```

## 1.3 本项目实际使用的技术参数

| 项目 | 历史配置 |
|---|---|
| VPN 协议 | WireGuard |
| 服务端接口 | wg0 |
| UDP 端口 | 51820 |
| 隧道网段 | 10.66.66.0/24 |
| 客户端地址 | 10.66.66.2、10.66.66.3 |
| MTU | 1380 |
| 出口网卡 | ens17 |
| NAT | MASQUERADE |
| TCP 优化 | TCPMSS clamp to PMTU |
| IP 转发 | IPv4 Forwarding |

以上为此前项目记录中使用过的配置。新建服务器时，应重新检查网卡名称、路由和实际网络环境。

These are historical project parameters. Always verify the network interface, routing table, and public IP of a newly purchased VPS.

---

# 02. VPS 服务器购买与选型

## 2.1 服务器应该如何选择？

VPN 服务器的性能不仅取决于 CPU 和内存，网络线路同样重要。

购买前主要关注：

1. 服务器所在地区。
2. 国际出口网络质量。
3. 到主要使用地的延迟。
4. 上传和下载带宽。
5. 每月流量限制。
6. 是否提供独立公网 IPv4。
7. 是否允许 UDP 流量。
8. 是否支持自定义防火墙规则。

Do not select a VPS based only on CPU specifications. Network routing, latency, bandwidth, and traffic limits are equally important.

## 2.2 推荐服务器配置

以下为个人 VPN 的起步建议：

| 项目 | 建议配置 |
|---|---|
| CPU | 1–2 核 |
| 内存 | 1–2 GB |
| 硬盘 | 20 GB 或以上 |
| 操作系统 | Ubuntu LTS |
| 公网 IP | 独立 IPv4 |
| 网络 | 稳定的国际线路 |
| 带宽 | 根据实际需求选择 |
| 流量 | 根据月度使用量选择 |

如果需要多个设备同时使用，建议选择更高带宽和流量配额。

## 2.3 服务器地区选择

不要只看服务器所在国家。

建议在购买前测试：

- 到实际使用地的 Ping 延迟。
- 白天和夜间的延迟变化。
- 网络丢包率。
- 下载速度。
- 上传速度。
- 路由稳定性。

尽可能选择提供测试 IP 的服务商。

## 2.4 购买完成后记录信息

建议建立服务器资产表：

| 信息 | 内容 |
|---|---|
| 服务商 | 自行填写 |
| 服务器名称 | 自行填写 |
| 地区 | 自行填写 |
| 公网 IP | 自行填写 |
| SSH 端口 | 自行填写 |
| 登录用户 | root 或指定用户 |
| 操作系统 | Ubuntu |
| CPU / RAM | 自行填写 |
| 带宽 | 自行填写 |
| 月流量 | 自行填写 |
| 到期日期 | 自行填写 |

不要在公开网站保存 SSH 密码、私钥或其他敏感凭据。

---

# 03. SSH 连接服务器

## 3.1 Windows 环境

Windows 10/11 可以直接使用 PowerShell。

检查 SSH：

```powershell
ssh -V
```

## 3.2 使用密码登录

```powershell
ssh root@YOUR_SERVER_IP
```

首次连接会提示确认服务器指纹。

确认指纹无误后输入：

```text
yes
```

然后输入服务器密码。

注意：输入密码时终端不会显示字符，这是正常现象。

## 3.3 使用 SSH 私钥登录

如果使用私钥：

```powershell
ssh -i "$env:USERPROFILE\.ssh\your-vps-key" root@YOUR_SERVER_IP
```

如果服务器使用自定义 SSH 端口：

```powershell
ssh -p 2222 -i "$env:USERPROFILE\.ssh\your-vps-key" root@YOUR_SERVER_IP
```

将端口和密钥路径替换成实际值。

## 3.4 检查登录状态

```bash
whoami
hostname
uname -a
```

成功登录后，应该可以看到服务器用户名、主机名和 Linux 内核信息。

## 3.5 SSH 安全建议

- 优先使用 SSH 密钥。
- 不要公开私钥。
- 不要随意修改 SSH 端口。
- 修改 SSH 安全配置前，保持当前 SSH 会话。
- 新连接验证成功后，再考虑关闭旧连接。

---

# 04. Ubuntu 服务器初始化

## 4.1 查看操作系统

```bash
cat /etc/os-release
```

本项目历史环境中使用过 Ubuntu 26.04 LTS。

其他 Ubuntu LTS 版本也可以按照相同的基本思路部署，但具体软件包和系统配置应以实际版本为准。

## 4.2 查看 CPU 和内存

```bash
lscpu
```

```bash
free -h
```

查看硬盘：

```bash
df -h
```

查看网卡：

```bash
ip addr
```

## 4.3 确认服务器出口网卡

这是非常重要的一步。

执行：

```bash
ip route get 1.1.1.1
```

示例结果：

```text
1.1.1.1 via 172.x.x.1 dev ens17
```

这里：

```text
ens17
```

就是服务器实际使用的出口网卡。

此前项目测试中使用过 ens17。

不同 VPS 可能使用 eth0、ens3 或其他名称，不能直接照抄。

## 4.4 更新系统

```bash
apt update
```

查看升级内容：

```bash
apt list --upgradable
```

执行：

```bash
apt upgrade -y
```

## 4.5 安装常用工具

```bash
apt install -y \
curl \
wget \
vim \
nano \
net-tools \
iproute2 \
iptables \
tcpdump \
iperf3 \
qrencode \
dnsutils \
traceroute \
mtr-tiny \
ca-certificates
```

这些工具分别用于：

- 网络连接检查。
- 防火墙规则管理。
- 抓包分析。
- 网络测速。
- DNS 检查。
- 路由分析。

---

# 05. 安装 WireGuard

## 5.1 安装软件包

Ubuntu 执行：

```bash
apt update
apt install -y wireguard wireguard-tools
```

## 5.2 检查版本

```bash
wg --version
```

## 5.3 检查内核模块

```bash
modprobe wireguard
```

没有报错即可继续。

## 5.4 创建配置目录

```bash
mkdir -p /etc/wireguard
chmod 700 /etc/wireguard
```

---

# 06. 生成服务器和客户端密钥

WireGuard 使用公钥和私钥识别不同 Peer。

每个 Peer 都应该拥有独立的密钥对。

Never share private keys. Only public keys should be exchanged between peers.

## 6.1 生成服务端密钥

服务器执行：

```bash
cd /etc/wireguard
umask 077
wg genkey | tee server_private.key | wg pubkey > server_public.key
```

查看服务端公钥：

```bash
cat server_public.key
```

查看服务端私钥：

```bash
cat server_private.key
```

私钥只用于服务端配置，不能公开。

## 6.2 生成客户端密钥

推荐直接在 Windows WireGuard 官方客户端中生成客户端密钥对。

也可以在 Linux 客户端执行：

```bash
umask 077
wg genkey | tee client1_private.key | wg pubkey > client1_public.key
```

客户端公钥需要添加到服务端配置。

客户端私钥保存在客户端本地。

---

# 07. 配置 WireGuard 服务端

## 7.1 开启 IPv4 转发

创建配置：

```bash
nano /etc/sysctl.d/99-wireguard.conf
```

写入：

```ini
net.ipv4.ip_forward=1
```

应用：

```bash
sysctl --system
```

检查：

```bash
sysctl net.ipv4.ip_forward
```

正常结果：

```text
net.ipv4.ip_forward = 1
```

## 7.2 创建 wg0.conf

执行：

```bash
nano /etc/wireguard/wg0.conf
```

写入下面的模板：

```ini
[Interface]
Address = 10.66.66.1/24
ListenPort = 51820
PrivateKey = SERVER_PRIVATE_KEY
MTU = 1380

PostUp = iptables -A FORWARD -i %i -j ACCEPT; iptables -A FORWARD -o %i -j ACCEPT; iptables -t nat -A POSTROUTING -s 10.66.66.0/24 -o ens17 -j MASQUERADE; iptables -t mangle -A FORWARD -o %i -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu; iptables -t mangle -A FORWARD -i %i -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

PostDown = iptables -D FORWARD -i %i -j ACCEPT; iptables -D FORWARD -o %i -j ACCEPT; iptables -t nat -D POSTROUTING -s 10.66.66.0/24 -o ens17 -j MASQUERADE; iptables -t mangle -D FORWARD -o %i -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu; iptables -t mangle -D FORWARD -i %i -p tcp --tcp-flags SYN,RST SYN -j TCPMSS --clamp-mss-to-pmtu

[Peer]
PublicKey = CLIENT1_PUBLIC_KEY
AllowedIPs = 10.66.66.2/32

[Peer]
PublicKey = CLIENT2_PUBLIC_KEY
AllowedIPs = 10.66.66.3/32
```

注意：

1. SERVER_PRIVATE_KEY 替换为服务端真实私钥。
2. CLIENT1_PUBLIC_KEY 和 CLIENT2_PUBLIC_KEY 替换为真实客户端公钥。
3. 如果出口网卡不是 ens17，必须替换。
4. 不同客户端必须使用不同隧道 IP。
5. 这份示例使用较宽的 FORWARD 放行规则，部署在已有复杂防火墙的服务器上之前，需要先审查现有规则和访问范围。
6. 不要直接覆盖原有防火墙配置。

## 7.3 设置文件权限

```bash
chmod 600 /etc/wireguard/wg0.conf
```

## 7.4 启动 WireGuard

```bash
systemctl enable wg-quick@wg0
```

启动：

```bash
systemctl start wg-quick@wg0
```

检查：

```bash
systemctl status wg-quick@wg0
```

查看接口：

```bash
ip addr show wg0
```

查看 WireGuard：

```bash
wg show
```

---

# 08. 配置防火墙与云服务器安全组

## 8.1 云服务商安全组

需要检查以下端口：

| 端口 | 协议 | 用途 |
|---|---|---|
| SSH 实际端口 | TCP | 远程管理 |
| 51820 | UDP | WireGuard |
| 5201 | TCP | 临时 iperf3 测速 |

建议 SSH 只允许可信来源 IP 登录。

UDP 51820 必须允许客户端访问。

TCP 5201 只在测速期间临时开放。

## 8.2 检查 UFW

```bash
ufw status numbered
```

此前某次历史测试中 UFW 状态为 inactive。

这只是当时服务器的状态，不代表所有服务器都应该关闭防火墙。

如果使用 UFW，必须先确认 SSH 端口放行，并针对转发流量配置对应的路由规则。

不要在没有检查 SSH 规则的情况下直接启用 UFW，以免失去远程连接。

---

# 09. 配置客户端

## 9.1 Windows 客户端

安装 WireGuard 官方客户端：

https://www.wireguard.com/install/

创建一个新的 Tunnel，生成客户端密钥。

## 9.2 客户端配置文件

示例：

```ini
[Interface]
PrivateKey = CLIENT_PRIVATE_KEY
Address = 10.66.66.2/32
DNS = 1.1.1.1
MTU = 1380

[Peer]
PublicKey = SERVER_PUBLIC_KEY
Endpoint = YOUR_SERVER_PUBLIC_IP:51820
AllowedIPs = 0.0.0.0/0
PersistentKeepalive = 25
```

字段说明：

| 字段 | 作用 |
|---|---|
| PrivateKey | 客户端私钥 |
| Address | 客户端隧道 IP |
| DNS | DNS 服务器 |
| MTU | 隧道 MTU |
| PublicKey | 服务端公钥 |
| Endpoint | 服务端公网 IP 和端口 |
| AllowedIPs | 需要通过 VPN 路由的地址 |
| PersistentKeepalive | 定期发送保活数据包 |

这里的 AllowedIPs 配置表示 IPv4 全局流量走 VPN。

如果没有额外配置 IPv6 路由，IPv6 流量可能仍然通过本地网络访问。需要 IPv6 全隧道时，应单独完成 IPv6 地址、转发、防火墙和路由配置。

## 9.3 多客户端配置

第二个客户端：

```ini
Address = 10.66.66.3/32
```

对应服务端：

```ini
[Peer]
PublicKey = CLIENT2_PUBLIC_KEY
AllowedIPs = 10.66.66.3/32
```

每个设备独立分配地址。

## 9.4 二维码导入

服务器端可以使用：

```bash
qrencode -t ansiutf8 < client1.conf
```

然后用手机 WireGuard 扫描。

注意：二维码包含客户端私钥，不要随意分享。

---

# 10. VPN 握手测试

握手是判断 WireGuard 是否真正建立通信的重要指标。

## 10.1 查看服务端状态

```bash
wg show wg0
```

正常输出会包含：

```text
interface: wg0
  listening port: 51820

peer:
  endpoint: CLIENT_PUBLIC_ENDPOINT
  allowed ips: 10.66.66.2/32
  latest handshake: seconds ago
  transfer: received, sent
```

## 10.2 如何判断握手成功？

重点检查：

- Peer 是否存在。
- Latest handshake 是否有时间。
- 接收和发送流量是否变化。
- 客户端是否可以访问隧道 IP。

可以使用：

```bash
watch -n 2 wg show
```

每两秒观察一次。

## 10.3 常见握手问题

如果一直没有 Latest handshake：

1. 检查服务端 UDP 51820。
2. 检查云安全组。
3. 检查 Endpoint。
4. 检查服务端公钥。
5. 检查客户端公钥。
6. 检查服务是否启动。
7. 检查网络是否限制 UDP。

WireGuard uses UDP. A configured interface does not necessarily mean a peer has completed a successful handshake.

---

# 11. NAT 与网络转发测试

握手成功，不代表外网访问已经成功。

还需要检查数据转发和 NAT。

## 11.1 检查 IP 转发

```bash
sysctl net.ipv4.ip_forward
```

预期：

```text
net.ipv4.ip_forward = 1
```

## 11.2 检查 FORWARD 规则

```bash
iptables -vnL FORWARD
```

历史项目中曾确认 wg0 双向 ACCEPT 规则存在，并且规则有流量命中。

## 11.3 检查 NAT

```bash
iptables -t nat -vnL POSTROUTING
```

历史项目中确认存在：

```text
MASQUERADE
```

出口网卡为：

```text
ens17
```

## 11.4 测试客户端公网 IP

客户端连接 VPN 后执行：

Windows：

```powershell
curl.exe -4 https://api.ipify.org
```

Linux：

```bash
curl -4 https://api.ipify.org
```

返回的公网 IPv4 应该与 VPN 服务器的出口公网 IPv4 一致。

## 11.5 检查 DNS

```powershell
nslookup example.com
```

如果能访问 IP，却不能访问域名，优先检查 DNS 设置。

---

# 12. MTU 与 TCPMSS 优化

这是此前项目中实际测试过的重要优化。

## 12.1 为什么要优化 MTU？

WireGuard 会封装原始网络数据包。

封装后，数据包会额外增加协议头。

如果 MTU 不合理，可能出现：

- 网站打开慢。
- 大文件下载失败。
- 某些 HTTPS 连接异常。
- TCP 重传增加。
- 部分网页无法加载。

## 12.2 历史项目 MTU

此前使用：

```ini
MTU = 1380
```

检查：

```bash
ip link show wg0
```

历史结果：

```text
wg0 mtu 1380
```

## 12.3 检查 TCPMSS

执行：

```bash
iptables -t mangle -vnL FORWARD
```

历史记录中确认存在：

```text
TCPMSS clamp to PMTU
```

并且双向规则有命中。

## 12.4 如何优化？

建议每次只调整一个参数：

1. 记录原始 MTU。
2. 测试当前速度。
3. 调整 MTU。
4. 重新启动接口。
5. 重复速度测试。
6. 对比丢包、延迟和重传。
7. 保留更稳定的配置。

不要盲目认为 1380 适合所有网络环境。

---

# 13. 抓包分析

抓包可以帮助判断数据有没有经过 WireGuard。

## 13.1 安装 tcpdump

```bash
apt install -y tcpdump
```

## 13.2 查看客户端 HTTPS 和 DNS

例如客户端 IP 为 10.66.66.3：

```bash
timeout 20 tcpdump -ni any \
'host 10.66.66.3 and (tcp port 443 or udp port 53 or tcp port 53)'
```

## 13.3 抓包结果分析

主要关注：

- wg0：解密后的隧道内数据。
- ens17：服务器外部网络数据。
- UDP 51820：WireGuard 外层加密数据包。

此前项目抓包已经观察到客户端 10.66.66.3 的 HTTPS 和 DNS 流量。

这说明客户端确实有网络数据经过服务器。

---

# 14. iperf3 速度测试

速度测试可以判断 VPN 的实际网络性能。

## 14.1 服务端启动 iperf3

```bash
iperf3 -s
```

默认监听 TCP 5201。

## 14.2 客户端测试上传

```powershell
iperf3 -c YOUR_TEST_SERVER_IP -p 5201 -P 4 -t 30
```

参数：

- -c：指定测试服务器。
- -p：指定端口。
- -P 4：四路并发。
- -t 30：测试30秒。

如果要测试 VPN 吞吐量，测试流量必须实际经过 VPN，并且测试服务端应当可以从 VPN 客户端访问。

## 14.3 测试下载

```powershell
iperf3 -c YOUR_TEST_SERVER_IP -p 5201 -P 4 -t 30 -R
```

## 14.4 单路 TCP 测试

```powershell
iperf3 -c YOUR_TEST_SERVER_IP -p 5201 -t 30
```

建议分别测试：

- 单路上传。
- 单路下载。
- 四路上传。
- 四路下载。

## 14.5 历史实测数据

2026年11月20日，项目历史记录：

| 测试项目 | 实测结果 |
|---|---:|
| 单路 TCP 测试 | 约 150 Mbit/s |
| 单路持续时间 | 30秒 |
| 单路 TCP 重传 | 0 |
| 四路并发测试 | 43.4 Mbit/s |
| 测试工具 | iperf3 |
| 历史测试地址 | 89.42.95.182:5201 |

以上数据来自当时的测试记录。

需要说明：历史记录能够确认客户端连接到了该 iperf3 测试地址，但不能仅凭该记录断言所有测试都经过同一台 WireGuard VPN 服务器。复现时应记录测试路径、方向和网络环境。

测试结束后关闭 iperf3：

```bash
Ctrl + C
```

并关闭临时开放的 TCP 5201 端口。

---

# 15. 长期稳定性测试

速度测试只是第一步。

长期稳定性才是正式使用前的重要验收项目。

## 15.1 10分钟测试

Windows：

```powershell
ping -n 600 1.1.1.1
```

检查：

- 丢包率。
- 平均延迟。
- 最大延迟。
- 延迟波动。

确保 VPN 已经连接，测试流量经过隧道。

## 15.2 1小时测试

Windows：

```powershell
ping -t 1.1.1.1
```

服务器：

```bash
watch -n 5 wg show
```

持续观察：

- 是否频繁断线。
- 握手是否正常。
- 数据流量是否增加。
- 是否出现明显丢包。
- 网页访问是否正常。

## 15.3 24小时稳定性测试

建议正式使用前进行24小时测试。

测试期间：

1. 保持客户端连接。
2. 定期记录握手状态。
3. 定期测试 DNS。
4. 测试不同时间段的网络速度。
5. 检查服务器 CPU 和内存。
6. 检查日志是否存在异常。
7. 记录断线次数。

检查 CPU：

```bash
top
```

检查内存：

```bash
free -h
```

检查网卡：

```bash
ip -s link show wg0
```

注意：24小时测试是建议的验收流程，并非此前历史记录已经证明完成的项目。

---

# 16. 开机自动启动

## 16.1 设置自动启动

```bash
systemctl enable wg-quick@wg0
```

## 16.2 检查是否启用

```bash
systemctl is-enabled wg-quick@wg0
```

预期：

```text
enabled
```

## 16.3 检查服务状态

```bash
systemctl status wg-quick@wg0
```

## 16.4 重启测试

确认 SSH 登录方式和服务器恢复方式正常后：

```bash
reboot
```

服务器重新启动后：

```bash
systemctl status wg-quick@wg0
```

```bash
wg show
```

确认：

- wg0 自动启动。
- UDP 51820 正常监听。
- 客户端能够重新握手。
- 流量能够正常传输。

---

# 17. 常见故障排查

## 17.1 客户端无法握手

检查：

```bash
systemctl status wg-quick@wg0
```

```bash
wg show
```

```bash
ss -lunp | grep 51820
```

排查：

- UDP 端口是否开放。
- 服务端公钥是否正确。
- 客户端公钥是否正确。
- Endpoint 是否正确。
- 云服务商是否限制 UDP。

## 17.2 握手成功但不能访问外网

检查：

```bash
sysctl net.ipv4.ip_forward
```

检查：

```bash
iptables -vnL FORWARD
```

检查：

```bash
iptables -t nat -vnL POSTROUTING
```

检查：

```bash
ip route get 1.1.1.1
```

重点检查：

- IPv4 转发。
- NAT。
- 出口网卡。
- 防火墙转发规则。

## 17.3 能访问 IP 但不能访问域名

执行：

```bash
nslookup example.com
```

检查客户端 DNS。

## 17.4 网页打开缓慢

检查：

1. MTU。
2. TCPMSS。
3. DNS。
4. 网络丢包。
5. 服务器出口带宽。
6. 路由情况。

## 17.5 速度忽高忽低

检查：

```bash
top
```

```bash
free -h
```

```bash
ip -s link show wg0
```

并重新进行单路和多路 iperf3 测试。

## 17.6 查看日志

```bash
journalctl -u wg-quick@wg0 -n 100 --no-pager
```

实时日志：

```bash
journalctl -u wg-quick@wg0 -f
```

---

# 18. 配置备份与安全

## 18.1 备份 WireGuard

```bash
tar -czf /root/wireguard-backup.tar.gz \
/etc/wireguard \
/etc/sysctl.d/99-wireguard.conf
```

设置权限：

```bash
chmod 600 /root/wireguard-backup.tar.gz
```

将备份下载到安全的本地位置。

## 18.2 安全要求

- 不要公开服务端私钥。
- 不要公开客户端私钥。
- 不要把密钥提交到 GitHub。
- 不要将包含密钥的配置文件发给陌生人。
- 定期检查 Peer。
- 删除不再使用的客户端。
- 测试结束关闭 iperf3 端口。
- 定期更新服务器系统。
- 保留 SSH 远程恢复能力。

## 18.3 删除客户端

从 `/etc/wireguard/wg0.conf` 中删除对应 Peer 配置，然后重新加载：

```bash
wg syncconf wg0 <(wg-quick strip wg0)
```

注意：该命令需要在 Bash 环境下执行。删除前先备份配置并确认 Peer 公钥，避免误删其他设备。

---

# 19. HENTOP VPN 历史项目实测记录

这一部分记录的是实际测试中已经观察到的结果，而不是理论性能指标。

## 19.1 WireGuard 配置

| 项目 | 历史记录 |
|---|---|
| 接口 | wg0 |
| 端口 | UDP 51820 |
| MTU | 1380 |
| 客户端地址 | 10.66.66.2 / .3 |
| 出口网卡 | ens17 |
| NAT | MASQUERADE |
| IP 转发 | 已开启 |
| TCPMSS | clamp to PMTU |

## 19.2 握手记录

2026年11月21日的历史记录中，两个 Peer 都有近期握手。

当时观察到的流量包括：

| 客户端 | 接收流量 | 发送流量 |
|---|---:|---:|
| 10.66.66.3 | 约 78.42 MiB | 约 1.88 GiB |
| 10.66.66.2 | 约 668.96 MiB | 约 1.82 GiB |

## 19.3 网络抓包

曾成功观察到：

- 客户端 HTTPS 流量。
- 客户端 DNS 流量。
- wg0 接口数据传输。
- 转发和 NAT 规则命中。

## 19.4 速度测试

历史 iperf3 测试：

- 单路 TCP 约 150 Mbit/s。
- 测试持续30秒。
- 单路测试重传为0。
- 四路并发测试约43.4 Mbit/s。

这些是当时测试环境下的结果，不代表所有服务器和网络环境都能达到相同速度。

## 19.5 尚需补充的验收

以下项目不能仅凭历史记录判定已经完成：

- 24小时连续稳定性测试。
- 所有节点的完整购买信息。
- 所有节点的重启恢复测试。
- 不同地区和不同运营商的长期性能对比。

---

# 20. 最终验收清单

## 服务器

- [ ] VPS 购买完成
- [ ] Ubuntu 安装完成
- [ ] SSH 登录成功
- [ ] 系统更新完成
- [ ] 出口网卡确认
- [ ] 公网 IP 正常

## WireGuard

- [ ] 安装完成
- [ ] 服务端密钥生成
- [ ] 客户端密钥生成
- [ ] wg0.conf 配置完成
- [ ] UDP 51820 开放
- [ ] IP 转发开启
- [ ] NAT 配置完成
- [ ] TCPMSS 配置完成
- [ ] 服务启动成功
- [ ] 开机自动启动

## 客户端

- [ ] Windows 客户端安装
- [ ] 客户端配置导入
- [ ] VPN 握手成功
- [ ] 收发流量正常
- [ ] DNS 正常
- [ ] 公网出口正确

## 网络性能

- [ ] 10分钟测试
- [ ] 1小时测试
- [ ] 24小时测试
- [ ] 上传测试
- [ ] 下载测试
- [ ] 丢包测试
- [ ] TCP 重传检查
- [ ] MTU 验证

## 安全与交付

- [ ] 配置备份
- [ ] 私钥安全保存
- [ ] SSH 访问正常
- [ ] 防火墙规则检查
- [ ] 临时测试端口关闭
- [ ] 重启恢复测试

---

# 总结 | Conclusion

通过以上步骤，可以从零建立一套属于自己的 WireGuard VPN 基础设施。

整个过程最重要的不是简单地安装 WireGuard，而是完成以下几个阶段：

1. 服务器选型和网络质量评估。
2. SSH 连接与系统初始化。
3. WireGuard 密钥和服务端配置。
4. 客户端配置与握手验证。
5. IP 转发和 NAT。
6. MTU 与 TCPMSS 优化。
7. 抓包和实际网络测速。
8. 长期稳定性测试。
9. 开机自动恢复。
10. 配置备份和安全管理。

**真正可用的 VPN，不仅要能握手，还必须能够稳定传输数据，并且经过实际性能和长期稳定性测试。**

The key to a reliable VPN is not simply establishing a WireGuard handshake. It is verifying routing, NAT, DNS, throughput, packet loss, long-term stability, and recovery after a reboot.

---

# 官方参考资料 | Official References

- WireGuard Official Website: https://www.wireguard.com/
- WireGuard Quick Start: https://www.wireguard.com/quickstart/
- Ubuntu WireGuard Documentation: https://ubuntu.com/server/docs/how-to/wireguard-vpn/
- Ubuntu WireGuard Troubleshooting: https://ubuntu.com/server/docs/how-to/wireguard-vpn/troubleshooting/
- Ubuntu WireGuard Default Gateway: https://ubuntu.com/server/docs/wireguard-vpn-defaultgw/
- iperf3: https://iperf.fr/

**作者 | Author:** BILL

**网站 | Website:** BILL'S DIGITAL WORLD

**文章类型 | Article Type:** Technical Guide / Infrastructure

**版本 | Version:** 1.0

**最后更新 | Last Updated:** November 22, 2026
