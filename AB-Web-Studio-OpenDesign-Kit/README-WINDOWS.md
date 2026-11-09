# AB Web Studio — OpenDesign Setup Kit

For the cloned Windows OpenDesign repository at `C:\Users\abuba\open-design`.

## 1. Install the custom brand

Extract the ZIP. In PowerShell, switch into the extracted folder and run:

```powershell
Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass
.\install-ab-studio.ps1 -OpenDesignPath 'C:\Users\abuba\open-design'
```

The policy change applies only to the current shell process; it does not persist.
The script checks that the target is an OpenDesign repo and refuses to overwrite an existing AB brand package. It only adds three files under `design-systems\ab-web-studio`.

Refresh OpenDesign's Design System surface/picker and select **AB Web Studio — Gilt & Ruby**. The catalog is rescanned on access; restarting is not normally needed. The `ab-digital-solutions` project context visible in your screenshot is not itself proof that the custom design system is selected; explicitly select the design system as well.

## 2. Verify Node and pnpm in Windows PowerShell

```powershell
node -v
pnpm -v
Set-Location 'C:\Users\abuba\open-design'
pnpm exec od --help
```

The repository expects Node 24.x and pnpm 10.33.2. If the OpenDesign daemon is already running, leave that original PowerShell process open and use a SECOND shell for CLI setup.

## 3. Connect Claude Code and Codex via MCP

Preview each configuration first:

```powershell
pnpm exec od mcp install claude --print
pnpm exec od mcp install codex --print
```

Then run, ONLY when previews are correct:

```powershell
pnpm exec od mcp install claude
pnpm exec od mcp install codex
```

If `pnpm exec od` isn't found or daemon-specific paths are wrong, use OpenDesign **Settings → MCP server** and copy the generated Windows client-specific snippets instead. Restart the coding-agent CLI session and confirm tools are available before use. Do not assume MCP is installed solely because OpenDesign is open in Chrome.

## 4. Create a safe prototype

In OpenDesign choose **Prototype** and use Prompt A in `OPEN-DESIGN-PROMPTS.md`. For the first run, use a fresh prototype project/isolated workspace, NOT a production editing task. Select **AB Web Studio — Gilt & Ruby** in the Design System picker. Keep `C:\Users\abuba\ab-digital-solutions` unmodified until the prototype is approved.

## 5. Review before implementation

Review desktop and mobile previews, contrast, content authenticity, forms and CTA behaviour, performance, reduced-motion and source output. Use Prompt C only after approval. Agents should work on a feature branch, protect production data, and avoid automatic deployment.

## Notes

The kit installs a local design package; it does NOT automatically edit the website, launch OpenDesign, connect cloud accounts, generate a prototype, or confirm a working model subscription. API usage may incur provider charges. Local-first does not mean zero telemetry or that third-party model requests remain local. In OpenDesign, review Settings → Privacy and model provider settings before sending confidential client data.
