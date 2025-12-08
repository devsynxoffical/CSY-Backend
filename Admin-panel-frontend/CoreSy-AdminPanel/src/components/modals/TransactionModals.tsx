import { useState } from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Typography,
    Box,
    Alert,
} from '@mui/material';

interface PayoutModalProps {
    open: boolean;
    onClose: () => void;
    transactionId?: string;
}

export const PayoutModal = ({ open, onClose, transactionId }: PayoutModalProps) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        console.log('Processing payout:', { transactionId, amount, reason });
        // API call would go here
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Process a payout for transaction {transactionId}
                    </Alert>

                    <TextField
                        fullWidth
                        label="Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Reason / Notes"
                        multiline
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for payout..."
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button variant="contained" onClick={handleSubmit} disabled={!amount}>
                    Process Payout
                </Button>
            </DialogActions>
        </Dialog>
    );
};

interface RefundModalProps {
    open: boolean;
    onClose: () => void;
    transactionId?: string;
}

export const RefundModal = ({ open, onClose, transactionId }: RefundModalProps) => {
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');

    const handleSubmit = () => {
        console.log('Processing refund:', { transactionId, amount, reason });
        // API call would go here
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Process Refund</DialogTitle>
            <DialogContent>
                <Box sx={{ pt: 2 }}>
                    <Alert severity="warning" sx={{ mb: 3 }}>
                        Process a refund for transaction {transactionId}
                    </Alert>

                    <TextField
                        fullWidth
                        label="Refund Amount"
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        sx={{ mb: 2 }}
                        InputProps={{
                            startAdornment: <Typography sx={{ mr: 1 }}>$</Typography>,
                        }}
                    />

                    <TextField
                        fullWidth
                        label="Refund Reason"
                        multiline
                        rows={4}
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Enter reason for refund..."
                        required
                    />
                </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Cancel</Button>
                <Button
                    variant="contained"
                    color="warning"
                    onClick={handleSubmit}
                    disabled={!amount || !reason}
                >
                    Process Refund
                </Button>
            </DialogActions>
        </Dialog>
    );
};
