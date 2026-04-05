import { describe, it, expect, vi, beforeEach } from "vitest";
import { screen, waitFor } from "@testing-library/react";
import { userEvent } from "@testing-library/user-event";
import { ArchiveConfirmModal } from "@/components/ArchiveConfirmModal";
import { renderWithProviders, mockProperty, mockArchivedProperty } from "@/test/utils";

describe("ArchiveConfirmModal", () => {
  const mockOnClose = vi.fn();
  const mockOnConfirm = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("Archive Mode", () => {
    it("should render archive confirmation for unarchived property", () => {
      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          activeLeaseCount={0}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText("Archive Property")).toBeInTheDocument();
      expect(screen.getByText(mockProperty.name)).toBeInTheDocument();
      expect(screen.getByText("Archive this property?")).toBeInTheDocument();
      expect(screen.getByText(/Archived properties are hidden/)).toBeInTheDocument();
    });

    it("should show warning when property has active leases", () => {
      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          activeLeaseCount={2}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText("Cannot archive property")).toBeInTheDocument();
      expect(screen.getByText(/This property has 2 active leases/)).toBeInTheDocument();
      
      // Archive button should be disabled
      const archiveButton = screen.getByRole("button", { name: /Archive Property/i });
      expect(archiveButton).toBeDisabled();
    });

    it("should show singular lease text for one active lease", () => {
      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          activeLeaseCount={1}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText(/This property has 1 active lease\./)).toBeInTheDocument();
    });

    it("should call onConfirm when archive button clicked", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          activeLeaseCount={0}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const archiveButton = screen.getByRole("button", { name: /Archive Property/i });
      await user.click(archiveButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should show loading state during archive operation", async () => {
      const user = userEvent.setup();
      let resolveConfirm: () => void;
      const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });
      mockOnConfirm.mockReturnValue(confirmPromise);

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          activeLeaseCount={0}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const archiveButton = screen.getByRole("button", { name: /Archive Property/i });
      await user.click(archiveButton);

      expect(screen.getByText("Archiving...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Cancel" })).toBeDisabled();

      resolveConfirm!();
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Unarchive Mode", () => {
    it("should render unarchive confirmation for archived property", () => {
      renderWithProviders(
        <ArchiveConfirmModal
          property={mockArchivedProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      expect(screen.getByText("Unarchive Property")).toBeInTheDocument();
      expect(screen.getByText("Restore this property?")).toBeInTheDocument();
      expect(screen.getByText(/will be restored to your active property list/)).toBeInTheDocument();
    });

    it("should call onConfirm when unarchive button clicked", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockArchivedProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const unarchiveButton = screen.getByRole("button", { name: /Unarchive Property/i });
      await user.click(unarchiveButton);

      expect(mockOnConfirm).toHaveBeenCalledTimes(1);
    });

    it("should show loading state during unarchive operation", async () => {
      const user = userEvent.setup();
      let resolveConfirm: () => void;
      const confirmPromise = new Promise<void>((resolve) => {
        resolveConfirm = resolve;
      });
      mockOnConfirm.mockReturnValue(confirmPromise);

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockArchivedProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const unarchiveButton = screen.getByRole("button", { name: /Unarchive Property/i });
      await user.click(unarchiveButton);

      expect(screen.getByText("Unarchiving...")).toBeInTheDocument();

      resolveConfirm!();
      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });
  });

  describe("Common Behaviors", () => {
    it("should call onClose when cancel button clicked", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const cancelButton = screen.getByRole("button", { name: "Cancel" });
      await user.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it("should call onClose after successful operation", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockResolvedValue(undefined);

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const archiveButton = screen.getByRole("button", { name: /Archive Property/i });
      await user.click(archiveButton);

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it("should handle onConfirm errors gracefully", async () => {
      const user = userEvent.setup();
      mockOnConfirm.mockRejectedValue(new Error("API Error"));

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      const archiveButton = screen.getByRole("button", { name: /Archive Property/i });
      await user.click(archiveButton);

      // Should not call onClose on error  
      await waitFor(() => {
        expect(screen.queryByText("Archiving...")).not.toBeInTheDocument();
      });
      expect(mockOnClose).not.toHaveBeenCalled();
    });

    it("should close modal when clicking outside content area", async () => {
      const user = userEvent.setup();

      renderWithProviders(
        <ArchiveConfirmModal
          property={mockProperty}
          onClose={mockOnClose}
          onConfirm={mockOnConfirm}
        />
      );

      // Click on the backdrop
      const backdrop = screen.getByRole("dialog").parentElement;
      if (backdrop) {
        await user.click(backdrop);
        expect(mockOnClose).toHaveBeenCalledTimes(1);
      }
    });
  });
});