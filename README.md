# sunucu-bot

A tiny bot that automatically **stops and starts your Minecraft server every 5 hours**, running entirely on **GitHub Actions**. No hosting needed, and on public repositories GitHub Actions minutes are unlimited, so it costs you nothing.

## Setup (2 minutes)

1. Click **Fork** (top right) to copy this repo to your own account.
2. In your fork, go to **Settings → Secrets and variables → Actions → New repository secret** and add:

| Secret | Value |
|---|---|
| `ATERNOS_USER` | your server panel username |
| `ATERNOS_PASS` | your server panel password |
| `ATERNOS_SERVER` | your server subdomain (optional, the first server is used if empty) |

3. Open the **Actions** tab, enable workflows, select **restart** and press **Run workflow** once to test it.

That is it. From now on it runs on its own.

## How it works

- `.github/workflows/r.yml` runs on a schedule at 00, 05, 10, 15 and 20 UTC (GitHub cron cannot do an exact "every 5 hours", so the gap at midnight is 4 hours).
- `restart.py` logs in, stops the server, waits until it is offline, then starts it again.
- Your credentials live only in your own repository secrets. They are never in the code and are not exposed to forks or pull requests.

## Notes

- GitHub disables scheduled workflows after 60 days without repository activity. Push a tiny commit once in a while to keep it alive.
- If login fails, the host firewall may be blocking GitHub IP addresses. Check the workflow logs.
- Use this only with servers and accounts you own or have permission to automate, and follow your host rules.

## Credits

Free to use, no license needed. If you use or share this, a small credit linking back to [ceyo0134](https://github.com/ceyo0134) would be really appreciated. It is a request, not a requirement. Thank you! 💚

## Player bot (optional)

`bot.js` is a Minecraft player bot (mineflayer). It joins your server, stays for 5 hours, leaves, rejoins 10-20 seconds later and reconnects if the server restarts. It only works on offline-mode (cracked) servers, and every server owner decides if bots are allowed.

- **GitHub Actions:** run the **bot** workflow once from the Actions tab. It chains itself every 5 hours. Add your bot password as the repository secret `MC_PASSWORD` (used for `/register` and `/login`). Optional variables (Settings → Variables): `MC_HOST`, `MC_USERNAME`, `MC_VERSION`.
- **Anywhere else:** `npm ci && MC_HOST=your.server MC_PASSWORD=yourpass node bot.js` (loops forever by itself).
