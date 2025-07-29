# Reusable Confirmation Modal

This project includes a reusable confirmation modal system that replaces browser's `window.confirm()` with a more elegant and customizable modal.

## Components

### 1. ConfirmationModal Component
Location: `src/components/ui/ConfirmationModal.jsx`

A React component that displays a modal with confirmation options.

### 2. useConfirmation Hook
Location: `src/hooks/useConfirmation.js`

A custom hook that provides easy-to-use methods for showing confirmation dialogs.

## Usage

### Basic Setup

1. Import the hook and component:
```jsx
import ConfirmationModal from "../components/ui/ConfirmationModal.jsx";
import { useConfirmation } from "../hooks/useConfirmation.js";
```

2. Use the hook in your component:
```jsx
const { confirmationConfig, confirmDanger, confirmWarning, showConfirmation } = useConfirmation();
```

3. Add the modal to your JSX:
```jsx
<ConfirmationModal
  show={confirmationConfig.show}
  type={confirmationConfig.type}
  title={confirmationConfig.title}
  message={confirmationConfig.message}
  confirmText={confirmationConfig.confirmText}
  cancelText={confirmationConfig.cancelText}
  onConfirm={confirmationConfig.onConfirm}
  onCancel={confirmationConfig.onCancel}
  confirmButtonClass={confirmationConfig.confirmButtonClass}
  cancelButtonClass={confirmationConfig.cancelButtonClass}
/>
```

### Examples

#### 1. Delete Confirmation (Danger)
```jsx
const handleDelete = async (id) => {
  const confirmed = await confirmDanger(
    "Delete Item",
    "Are you sure you want to delete this item? This action cannot be undone.",
    { confirmText: "Delete" }
  );

  if (confirmed) {
    // Proceed with deletion
    await deleteItem(id);
  }
};
```

#### 2. Warning Confirmation
```jsx
const handleUnsavedChanges = async () => {
  const confirmed = await confirmWarning(
    "Unsaved Changes",
    "You have unsaved changes. Are you sure you want to leave without saving?",
    { confirmText: "Leave", cancelText: "Stay" }
  );

  if (confirmed) {
    navigate('/other-page');
  }
};
```

#### 3. Custom Confirmation
```jsx
const handleCustomAction = async () => {
  const confirmed = await showConfirmation({
    type: "info",
    title: "Custom Action",
    message: "This will perform a custom action. Continue?",
    confirmText: "Yes, Continue",
    cancelText: "Cancel",
    confirmButtonClass: "bg-purple-500 hover:bg-purple-600 text-white"
  });

  if (confirmed) {
    // Perform custom action
  }
};
```

## Modal Types

- **danger**: Red styling, for destructive actions (delete, remove, etc.)
- **warning**: Orange styling, for potentially risky actions
- **success**: Green styling, for positive confirmations
- **info**: Blue styling, for informational confirmations

## Options

All confirmation methods accept an optional options object:

```jsx
{
  confirmText: "Custom Confirm Text",
  cancelText: "Custom Cancel Text",
  confirmButtonClass: "custom-button-classes",
  cancelButtonClass: "custom-cancel-classes"
}
```

## Migration from window.confirm()

Replace this:
```jsx
if (!window.confirm("Are you sure?")) {
  return;
}
// Perform action
```

With this:
```jsx
const confirmed = await confirmDanger("Confirm Action", "Are you sure?");
if (!confirmed) {
  return;
}
// Perform action
```

## Benefits

1. **Consistent UI**: Matches your application's design system
2. **Customizable**: Different types and styling options
3. **Better UX**: More informative with title and detailed message
4. **Mobile Friendly**: Works better on mobile devices than browser dialogs
5. **Async/Await Support**: Cleaner code with promise-based API
6. **Accessible**: Better accessibility features than browser dialogs
