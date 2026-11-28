import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import DeleteOutlineOutlinedIcon from '@mui/icons-material/DeleteOutlineOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { organisationApi } from '@/api/organisation';
import ConfirmDialog from '@/components/ConfirmDialog';
import { useNotify } from '@/hooks/useNotify';

const EMPTY_FORM = { name: '', order: 0, mandatory: true };

export default function DepartmentsDialog({ open, institute, onClose }) {
  const notify = useNotify();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [deleting, setDeleting] = useState(null);

  const loadDepartments = async () => {
    if (!institute?.id) return;
    setLoading(true);
    try {
      const rows = await organisationApi.departments(institute.id);
      setDepartments(rows);
    } catch (error) {
      notify.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!open) return undefined;
    let active = true;
    Promise.resolve().then(async () => {
      if (!active || !institute?.id) return;
      setLoading(true);
      try {
        const rows = await organisationApi.departments(institute.id);
        if (active) setDepartments(rows);
      } catch (error) {
        if (active) notify.error(error);
      } finally {
        if (active) setLoading(false);
      }
    });
    return () => {
      active = false;
    };
    // Load only when the selected institute/dialog changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, institute?.id]);

  const startEdit = (department) => {
    setEditing(department);
    setForm({
      name: department.name,
      order: department.order ?? 0,
      mandatory: department.mandatory !== false,
    });
  };

  const resetForm = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
  };

  const save = async (event) => {
    event.preventDefault();
    if (!form.name.trim()) {
      notify.error('Enter a department name');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: form.name.trim(),
        order: Number(form.order) || 0,
        mandatory: Boolean(form.mandatory),
      };
      if (editing) {
        await organisationApi.updateDepartment(institute.id, editing.id ?? editing._id, payload);
        notify.success('Department updated');
      } else {
        await organisationApi.createDepartment(institute.id, payload);
        notify.success('Department added');
      }
      resetForm();
      await loadDepartments();
    } catch (error) {
      notify.error(error);
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    if (!deleting) return;
    try {
      await organisationApi.deleteDepartment(institute.id, deleting.id ?? deleting._id);
      notify.success('Department deleted');
      setDeleting(null);
      await loadDepartments();
    } catch (error) {
      notify.error(error);
      setDeleting(null);
    }
  };

  return (
    <>
      <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
        <DialogTitle>
          <Typography variant="h6" fontWeight={700}>
            Department setup
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {institute?.name} · Manage clearance departments for this institute
          </Typography>
        </DialogTitle>
        <DialogContent dividers>
          <Box
            component="form"
            onSubmit={save}
            sx={{
              display: 'grid',
              gridTemplateColumns: { xs: '1fr', sm: 'minmax(0, 2fr) minmax(100px, 0.7fr)' },
              gap: 2,
              alignItems: 'start',
              mb: 3,
            }}
          >
            <TextField
              label="Department name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              required
              fullWidth
              size="small"
            />
            <TextField
              label="Display order"
              type="number"
              value={form.order}
              onChange={(event) =>
                setForm((current) => ({ ...current, order: event.target.value }))
              }
              slotProps={{ htmlInput: { min: 0 } }}
              size="small"
              fullWidth
            />
            <FormControlLabel
              sx={{ gridColumn: { sm: '1 / -1' }, mt: -1 }}
              control={
                <Switch
                  checked={Boolean(form.mandatory)}
                  onChange={(event) =>
                    setForm((current) => ({ ...current, mandatory: event.target.checked }))
                  }
                />
              }
              label="Mandatory for clearance"
            />
            <Stack direction="row" spacing={1} sx={{ gridColumn: { sm: '1 / -1' } }}>
              <Button type="submit" variant="contained" disabled={saving}>
                {editing ? 'Save department' : 'Add department'}
              </Button>
              {editing && (
                <Button onClick={resetForm} disabled={saving}>
                  Cancel edit
                </Button>
              )}
            </Stack>
          </Box>

          <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>
            Existing departments
          </Typography>
          {loading ? (
            <Typography color="text.secondary">Loading departments…</Typography>
          ) : departments.length === 0 ? (
            <Typography color="text.secondary">No departments configured yet.</Typography>
          ) : (
            <Box sx={{ overflowX: 'auto' }}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Department</TableCell>
                    <TableCell>Order</TableCell>
                    <TableCell>Clearance rule</TableCell>
                    <TableCell align="right">Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {departments.map((department) => (
                    <TableRow key={department.id ?? department._id}>
                      <TableCell>{department.name}</TableCell>
                      <TableCell>{department.order ?? 0}</TableCell>
                      <TableCell>{department.mandatory ? 'Mandatory' : 'Optional'}</TableCell>
                      <TableCell align="right">
                        <IconButton
                          aria-label={`Edit ${department.name}`}
                          size="small"
                          onClick={() => startEdit(department)}
                        >
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          aria-label={`Delete ${department.name}`}
                          size="small"
                          color="error"
                          onClick={() => setDeleting(department)}
                        >
                          <DeleteOutlineOutlinedIcon fontSize="small" />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose}>Close</Button>
        </DialogActions>
      </Dialog>

      <ConfirmDialog
        open={Boolean(deleting)}
        title={`Delete ${deleting?.name ?? 'department'}?`}
        message="Departments already used by clearance records or staff assignments cannot be deleted. You can mark them as optional instead."
        confirmLabel="Delete"
        danger
        onConfirm={remove}
        onClose={() => setDeleting(null)}
      />
    </>
  );
}
