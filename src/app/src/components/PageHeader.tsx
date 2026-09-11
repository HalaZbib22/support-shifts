import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";

export function PageHeader({ title, sub, right }: { title: string; sub?: React.ReactNode; right?: React.ReactNode }) {
  return (
    <Box sx={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: 2, flexWrap: "wrap", mb: 2 }}>
      <Box>
        <Typography variant="h1">{title}</Typography>
        {sub && <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>{sub}</Typography>}
      </Box>
      {right}
    </Box>
  );
}
