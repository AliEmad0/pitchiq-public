export type FormResult = "W" | "D" | "L";

export function chipClasses(result: FormResult): string {
  switch (result) {
    case "W":
      return "bg-success/15 text-success ring-success/30";
    case "D":
      return "bg-muted text-muted-foreground ring-border";
    case "L":
      return "bg-destructive/15 text-destructive ring-destructive/30";
  }
}
