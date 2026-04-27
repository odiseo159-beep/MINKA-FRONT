import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { LegalAgentPanel } from "@/components/legal-agent-panel";

vi.mock("@/lib/api", () => ({
  agentApi: {
    run: vi.fn().mockResolvedValue({
      accion: "asesorar",
      resultado: "## Estrategia\nDefensa por falta de pruebas.",
      tools_usados: ["consejo_procesal"],
      tokens_usados: 500,
      cached: false,
    }),
  },
}));

vi.mock("@/lib/auth-store", () => ({
  useAuthStore: (selector: (s: { token: string }) => string) => selector({ token: "test-token" }),
}));

describe("LegalAgentPanel", () => {
  it("muestra los 4 botones de acción", () => {
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    expect(screen.getByText(/Analizar/i)).toBeInTheDocument();
    expect(screen.getByText(/Asesor/i)).toBeInTheDocument();
    expect(screen.getByText(/Redactar/i)).toBeInTheDocument();
    expect(screen.getByText(/Normativa/i)).toBeInTheDocument();
  });

  it("deshabilita Analizar si no hay documentos", () => {
    render(<LegalAgentPanel casoId={1} tieneDocumentos={false} />);
    const btn = screen.getByRole("button", { name: /Analizar/i });
    expect(btn).toBeDisabled();
  });

  it("muestra resultado al hacer click en Asesor", async () => {
    const user = userEvent.setup();
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    await user.click(screen.getByRole("button", { name: /Asesor/i }));
    expect(await screen.findByText(/Estrategia/i)).toBeInTheDocument();
  });

  it("no llama al API al hacer click en Redactar (espera sub-form)", async () => {
    const { agentApi } = await import("@/lib/api");
    const runSpy = vi.spyOn(agentApi, "run");
    runSpy.mockClear();
    const user = userEvent.setup();
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    await user.click(screen.getByRole("button", { name: /Redactar/i }));
    expect(runSpy).not.toHaveBeenCalled();
    expect(screen.getByText(/Tipo de escrito/i)).toBeInTheDocument();
    runSpy.mockRestore();
  });

  it("no llama al API al hacer click en Normativa (espera query)", async () => {
    const { agentApi } = await import("@/lib/api");
    const runSpy = vi.spyOn(agentApi, "run");
    runSpy.mockClear();
    const user = userEvent.setup();
    render(<LegalAgentPanel casoId={1} tieneDocumentos={true} />);
    await user.click(screen.getByRole("button", { name: /Normativa/i }));
    expect(runSpy).not.toHaveBeenCalled();
    expect(screen.getByPlaceholderText(/prescripción/i)).toBeInTheDocument();
    runSpy.mockRestore();
  });
});
