import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogContentText,
    DialogActions,
    Button,
} from '@mui/material';
import { Warning as WarningIcon } from '@mui/icons-material';

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
    confirmColor?: 'primary' | 'error' | 'warning' | 'success';
}

export const ConfirmDialog = ({
    open,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    onCancel,
    confirmColor = 'error',
}: ConfirmDialogProps) => {
    return (
        <Dialog
            open={open}
            onClose={onCancel}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: '12px',
                },
            }}
        >
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, pb: 1 }}>
                <WarningIcon color={confirmColor} />
                {title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText sx={{ fontSize: '0.95rem', color: 'text.primary' }}>
                    {message}
                </DialogContentText>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
                <Button onClick={onCancel} variant="outlined" sx={{ borderRadius: '8px' }}>
                    {cancelText}
                </Button>
                <Button
                    onClick={onConfirm}
                    variant="contained"
                    color={confirmColor}
                    sx={{ borderRadius: '8px' }}
                >
                    {confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

