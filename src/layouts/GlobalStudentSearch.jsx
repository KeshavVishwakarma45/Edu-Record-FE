import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Autocomplete, Avatar, Box, InputAdornment, TextField, Typography } from '@mui/material';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { studentsApi } from '@/api/students';

// Global student lookup. It reuses the existing students list endpoint and its `search`
// parameter; results open the existing Student Profile route.
export default function GlobalStudentSearch() {
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const value = query.trim();
    if (value.length < 2) return undefined;

    let active = true;
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const result = await studentsApi.list({ page: 1, limit: 8, search: value });
        if (active) setOptions(result.rows || []);
      } catch {
        if (active) setOptions([]);
      } finally {
        if (active) setLoading(false);
      }
    }, 300);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const handleShortcut = (event) => {
      const target = event.target;
      const isTyping =
        target instanceof HTMLElement &&
        (target.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName));

      if (event.key === '/' && !event.ctrlKey && !event.metaKey && !event.altKey && !isTyping) {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };

    window.addEventListener('keydown', handleShortcut);
    return () => window.removeEventListener('keydown', handleShortcut);
  }, []);

  const openStudent = (student) => {
    if (!student?._id) return;
    setQuery('');
    setOptions([]);
    navigate(`/students/${student._id}`);
  };

  return (
    <Autocomplete
      fullWidth
      options={query.trim().length >= 2 ? options : []}
      value={null}
      inputValue={query}
      loading={loading}
      filterOptions={(items) => items}
      getOptionLabel={(student) => student?.name || ''}
      isOptionEqualToValue={(option, value) => option._id === value._id}
      noOptionsText={query.trim().length < 2 ? 'Type at least 2 characters' : 'No students found'}
      loadingText="Searching students…"
      onInputChange={(_, value, reason) => {
        if (reason === 'input' || reason === 'clear') {
          setQuery(value);
          setOptions([]);
          setLoading(value.trim().length >= 2);
        }
      }}
      onChange={(_, student) => openStudent(student)}
      renderOption={(props, student) => (
        <Box component="li" {...props} key={student._id} sx={{ gap: 1.25, py: 1 }}>
          <Avatar
            sx={{
              width: 34,
              height: 34,
              fontSize: 13,
              bgcolor: 'action.selected',
              color: 'text.primary',
            }}
          >
            {(student.name || '?').trim().charAt(0).toUpperCase()}
          </Avatar>
          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography noWrap sx={{ fontSize: 14, fontWeight: 600 }}>
              {student.name || 'Unnamed student'}
            </Typography>
            <Typography noWrap variant="caption" color="text.secondary">
              Scholar: {student.scholarNo || '—'} · Enrollment: {student.enrollmentNo || '—'} ·
              Mobile: {student.mobile || '—'}
            </Typography>
          </Box>
        </Box>
      )}

      renderInput={(params) => (
        <TextField
          {...params}
          inputRef={inputRef}
          placeholder="Search students by name, scholar no., enrollment no., or mobile"
          slotProps={{
            ...params.slotProps,
            htmlInput: {
              ...params.slotProps.htmlInput,
              'aria-label': 'Search students by name, scholar number, enrollment number or mobile',
            },
            input: {
              ...params.slotProps.input,
              startAdornment: (
                <>
                  <InputAdornment position="start">
                    <SearchOutlinedIcon sx={{ color: 'text.secondary', fontSize: 19 }} />
                  </InputAdornment>
                  {params.slotProps.input.startAdornment}
                </>
              ),
              endAdornment: (
                <>
                  {params.slotProps.input.endAdornment}
                  <InputAdornment position="end">
                    <Box
                      component="kbd"
                      sx={{
                        px: 0.8,
                        py: 0.15,
                        border: 1,
                        borderColor: 'divider',
                        borderRadius: 1,
                        color: 'text.secondary',
                        fontSize: 12,
                        lineHeight: 1.5,
                        fontFamily: 'inherit',
                      }}
                    >
                      /
                    </Box>
                  </InputAdornment>
                </>
              ),
            },
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              height: 44,
              borderRadius: 2.5,
              bgcolor: 'background.paper',
              fontSize: 13,
              '& fieldset': {
                borderColor: 'divider',
                borderWidth: 1.5,
              },
            },
          }}
        />
      )}
    />
  );
}
