---
date: 2020-04-09T00:00:00
url: /homelab/lets-encrypt-the-house
tags:
  - homelab
writer: dzervas
build_status: passing
image: /images/notion-db9c6583-f1cb-4edb-b5f5-8f80725ac6c7-image.jpeg
title: Let's Encrypt the house!
---
```callout gray_background
💡This whole setup described is deprecated. Cloudflare offers this whole service for free with a much easier setup and 0 maintenance. Reported by an [HN comment](https://news.ycombinator.com/item?id=22838330) (my handle on HN is ttouch). Don’t use what I describe bellow unless you really have a reason not to use Cloudflare. That’s what this blog is about. Failures 🙂
```

That’s what my mother always said when I was little. And don’t talk to strangers. And the cold comes from the feet (so never walk barefoot). I never got it. How the hell do you use proper signed certificates in a private network? Why have a house if you can’t walk around barefoot? Anyway…

This is my trip on using Let’s Encrypt in a homelab setup on a very limited budget. It should be a fire & forget implementation. I don’t want to `scp` 20 certificates every 3 months but it has to be a secure implementation as well - exposing the internal services to the internet is a no-go.

A little side note to the readers that are not yet sure why I don’t go to a PKI (aka managing my own CA) solution: That CA can sign ANYTHING, even google.com, so if the CA gets compromised, as long as you don’t notice, you’re on deep shit… That can be solved with the [Name Constraints](https://wiki.mozilla.org/CA:NameConstraints) extension (limits the domains that a CA can sign to a certain domain or TLD). But then again, where do you keep it? HSMs are pricey. Even then, will you enter the password every now and then? On which machine? Will it be air-gapped? How do you transfer the CSR? Or maybe you set up your own ACME provider (like [step ca](https://github.com/smallstep/certificates) does)? Then you will have to harden the whole machine as it’s not air-gapped…

Also mobiles no longer trust user provided CAs. Actually they do, but they do so only for the built-in browser & mail client, so you lose any native app that supports your self hosted services (ex. Home Assistant app).

## The idea

This struck me on a Monday night ~4 A.M. while trying to sleep. I was thinking all the things that I explained above. How? Where? For how long?

Then *poof*, out of nowhere: use a whole domain, or a subdomain that points at a DNS server inside my home network, just to prove LE that you own it and use the signed certificates however I like.

![I miss Futurama so fucking much…](/images/notion-37a101bd-4175-4bc9-acb4-563b6ef2505a-the-idea.gif)

At that point, I thought that this was kinda abusing Let’s Encrypt, but then again, isn’t that how VPCs work now?

Of course I would have to make my local DNS server “spoof” that domain and make it point to local IP addresses (by hand, can’t trust DHCP clients mess with my certificates…). Well that’s super easy, a DNS server is already running on my network (resolves DHCP hostnames) and I have root access on it (I have an [Alix2](https://www.pcengines.ch/alix2.htm)) so if I’m gonna run all of my services on a single server, I can put a wildcard A record (each service will have its own subdomain).

So I’ll need a dynamic DNS (paid service or if self hosted, yet another moving part). But wait, why set up that shit and not create a VPN tunnel between a random VPS and my server and forward any DNS requests to the VPS to my server over VPN? Bingo! :D

## ACME challenges

![It’s widely known that ACME can be very challenging when it comes to safe tool usage](/images/notion-95a6503a-a5bc-415f-a85b-e1dcc934005a-acme.jpeg)

Let’s Encrypt is a CA that issues certificates for free AND automatically. It’s really amazing. They did the web a better place!

What they need to know to sign my certificate, is just that I actually own the domain I say I do. Nothing more. But how do I prove such thing?

They use the ACME protocol to certify that I own the sub/domain I request a certificate for. I have to successfully complete a challenge in order for them to verify it’s me. I won’t get into much details - as I actually don’t know the whole process - but there are 3 available challenges (pick 1):

 - HTTP
 - DNS
 - TLS (I have no idea how this works)
With HTTP:

 > Let’s Encrypt gives a token to your ACME client, and your ACME client puts a file on your web server at http://<YOUR_DOMAIN>/.well-known/acme-challenge/
(as described [here](https://letsencrypt.org/docs/challenge-types/#http-01-challenge))

With DNS, a TXT record should be hosted containing a random string that LE gave, at a specific subdomain of the subdomain we’re trying to sign (`_acme_challenge.<YOUR_SUBDOMAIN>.`). The DNS challenge is also the only challenge that has the ability to issue a wildcard certificate (as there’s no way with an HTTP request prove that I’m in control of all of the subdomains, unlike a DNS wildcard record).

For more info about ACME challenges clap (click/tap) [this](https://letsencrypt.org/docs/challenge-types/).

Of course nobody wants to move around random strings by hand or create new certificates every 3 months (LE only signs certificate for 3 months max), so there are a bunch of [ACME clients](https://letsencrypt.org/docs/client-options/) that handle all that fuss. I’d just have to reload the certificate every 3 months - or just restart the whole service.

## Our setup

Ok, all this sound good (and a bit complicated) but how will I get the green lock on my plex porn cluster you ask? Let me show you, I answer…

Stuff we need:

 - A domain name (or subdomain) - each service will have its own subdomain. For this example we will use `home.whynot.net`
 - A VPS (Google Cloud gives you one for [free](https://cloud.google.com/free))
 - An NS record pointing the domain to your VPS
 - IPTables rules to redirect any DNS requests from the VPS to acme-dns (will explain bellow)
 - A local DNS server pointing `<service>.home.whynot.net` to the appropriate machine(s)
{{<mermaid>}}
graph LR;
A((internet)) -->|DNS TXT| B[VPS];
C((internet)) -->|wg0| B;
C ---|wg0| D[server];
D --- E(Docker);
E -->|DNS TXT| F(Docker);
F(acme-dns) -->|53| E;
{{</mermaid>}}

{{<mermaid>}}
sequenceDiagram
  traefik ->> acme: Certificate for wiki.home.whynot.fail
  acme -->> letsencrypt: Certificate for wiki.home.whynot.fail
  letsencrypt -->> acme: [challenge-string]
  acme -->> letsencrypt: do the challenge
  letsencrypt ->> root dns: TXT _acme_challenge.wiki.home.whynot.fail
  root dns ->> letsencrypt: _acme_challenge.wiki.home.whynot.fail NS [VPS]
  letsencrypt ->> VPS: TXT _acme_challenge...
  VPS -->> wg0 (server): DNS request
  wg0 (server) -->> wg0 (client): DNS request
  wg0 (client) -->> home server: DNS request
  home server ->> acme: TXT _acme_challenge...
  acme ->> home server: "TXT . . IN [challenge-string]"
  home server -->> wg0 (client): DNS request
  wg0 (client) -->> wg0 (server): DNS request
  wg0 (server) -->> VPS: DNS request
  VPS -->> letsencrypt: "TXT . . IN [challenge-string]"
  letsencrypt -->> acme: [signed certificate]
acme ->> traefik: key & signed cert for wiki.home.whynot.fail
{{</mermaid>}}

This is how the whole thing works. It seems way harder than it actually is (unlike anything else in computer science).

To the ~~dungeon~~ implementation!

## Do the thing

First of all, let’s create a wireguard VPN tunnel between the VPS and the server. I’m not gonna describe how to do that as Stavros described it very well at his [post](https://www.stavros.io/posts/how-to-configure-wireguard/). Do it and come back, I’ll wait (you don’t need to be able to “access your home LAN”, “just a single connection” is good enough for this setup)

Now I have a `wg0` network interface on both machines pointing at each other on a weird subnet over an encrypted tunnel. Good :)

VPS: `192.168.2.1`

Local Server: `192.168.2.2`

Now we need to forward the DNS requests to the local server using iptables rules on the VPS. Of course we’re not gonna write iptables, as the cool kids use [ferm](http://ferm.foo-projects.org/) these days…

Add these at `/etc/ferm/ferm.conf`:

```plaintext Text
@def $WAN_DEV = eth0;
@def $WG_DEV = wg0;
@def $WG_IP = 192.168.2.1;

@def &PORT_FORWARD($proto, $sport, $dport, $dest) = {
    table nat chain PREROUTING interface $WAN_DEV proto $proto dport $sport DNAT to "$dest:$dport";
    table filter chain FORWARD interface $WAN_DEV outerface $WG_DEV daddr $dest proto $proto dport $dport mod conntrack ctstate NEW ACCEPT;
    table nat chain POSTROUTING outerface $WG_DEV proto $proto dport $dport daddr $dest SNAT to 10.192.192.1;
}

&PORT_FORWARD((tcp udp), 53, 53, 192.168.2.2);

table filter chain FORWARD mod conntrack ctstate (ESTABLISHED RELATED) ACCEPT;
```

### A bit about ferm

This just forwards a port. But let’s dive in a bit cause it took me 3 days to figure it out (for some reason nobody thinks that SNAT is needed)

First of all, some basic ferm: `@def $<name> = <value>` assigns a variable. Keep in mind that with ``whoami`` as the value, `whoami` is executed and the output is stored as value - that way for example, you can automatically find an interface’s IP or create rules for docker bridges (leaving it for another post).

We can reference the variables anywhere using the `$<name>` notation.

Next we have a function definition with `@def &<name>([arguments...]) = {<rules}`.

We can call the function with the `&<name>([arguments...]);` notation.

Now about the rules. This happens after the above piece of “code” executes:

 1. The destination address of any packet coming to the external interface at port 53 (tcp or udp) is changed to “192.168.2.2” (so it is forwarded to wg0)
 2. Allow the forwarding of packets coming from the external interface to port 53 going to wg0 (tcp or udp)
 3. Change the source address of packets that are going to wg0 to “192.168.2.1” - otherwise wireguard will block the packet as it’s not in the `AllowedIPs`
 4. (last line) Keep track of what packet has changed addresses and change them back (or do other stuff) when the answer comes back from the acme-dns server
### Set up acme-dns

Well that’s easy - docker. End of story

Go to the home server and do the following:

Download [config.cfg](https://raw.githubusercontent.com/joohoi/acme-dns/master/config.cfg) for acme-dns to `acme-dns.cfg`. Configure it as you want (note that anyone that has access to acme-dns’ HTTP API, has the ability to issue a certificate!)

Now run: `docker run --restart=unless-stopped --name acmedns -p 192.168.2.2:53:53 -p 192.168.2.2:53:53/udp -p 127.0.0.1:80:80 -v config.cfg:/etc/acme-dns:ro -v /etc/acme-dns/:/var/lib/acme-dns -d joohoi/acme-dns`

Last but not least, let your local DNS server know that `<service>.home.whynot.net` points to the internal IP address of the local server.

Done!

But. Um. Where are the certificates?

Well that’s on you. You get to decide how/why/when/where the certificates are generated & stored. I went with traefik and will describe it in a next post. Until then, check out acme-dns [clients](https://github.com/joohoi/acme-dns#clients) on how to use acme-dns!

![obama-done.jpeg](/images/notion-5dae38f1-dce5-4ccd-9c8a-3d01334e0295-obama-done.jpeg)

Have fun & stay safe!

