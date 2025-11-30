import type { ChecklistItem } from "~types"

interface ChecklistPanelProps {
  items: ChecklistItem[]
}

const ChecklistPanel = ({ items }: ChecklistPanelProps) => {
  // Group items by category
  const groupedItems = items.reduce((acc, item) => {
    const category = item.category || 'Other'
    if (!acc[category]) {
      acc[category] = []
    }
    acc[category].push(item)
    return acc
  }, {} as Record<string, ChecklistItem[]>)

  const categories = Object.keys(groupedItems).sort()

  if (items.length === 0) {
    return (
      <div style={{
        padding: '32px',
        textAlign: 'center',
        color: '#9ca3af',
        fontSize: '14px'
      }}>
        <p>Loading checklist...</p>
      </div>
    )
  }

  return (
    <div style={{ padding: '16px' }}>
      {categories.map(category => (
        <div key={category} style={{ marginBottom: '24px' }}>
          <h4 style={{
            margin: '0 0 12px 0',
            fontSize: '13px',
            fontWeight: 600,
            color: '#6b7280',
            textTransform: 'uppercase',
            letterSpacing: '0.5px'
          }}>
            {category.replace('_', ' ')}
          </h4>

          {groupedItems[category]
            .sort((a, b) => a.order - b.order)
            .map(item => (
              <div key={item.id} style={{
                marginBottom: '12px',
                padding: '12px',
                background: item.completed ? '#f0fdf4' : '#f9fafb',
                borderLeft: `3px solid ${item.completed ? '#10b981' : '#e5e7eb'}`,
                borderRadius: '4px',
                transition: 'all 0.2s ease'
              }}>
                <div style={{
                  display: 'flex',
                  alignItems: 'start',
                  gap: '10px'
                }}>
                  <div style={{
                    marginTop: '2px',
                    flexShrink: 0,
                    width: '18px',
                    height: '18px',
                    borderRadius: '50%',
                    background: item.completed ? '#10b981' : 'white',
                    border: item.completed ? '2px solid #10b981' : '2px solid #d1d5db',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s ease'
                  }}>
                    {item.completed && (
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    )}
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{
                      fontSize: '14px',
                      fontWeight: 500,
                      color: item.completed ? '#065f46' : '#374151',
                      marginBottom: item.description || item.extractedInfo ? '4px' : 0
                    }}>
                      {item.label}
                      {item.required && !item.completed && (
                        <span style={{
                          fontSize: '12px',
                          color: '#ef4444',
                          marginLeft: '4px'
                        }}>*</span>
                      )}
                    </div>

                    {item.description && !item.completed && (
                      <div style={{
                        fontSize: '12px',
                        color: '#6b7280',
                        marginBottom: '4px'
                      }}>
                        {item.description}
                      </div>
                    )}

                    {item.completed && item.extractedInfo && (
                      <div style={{
                        fontSize: '12px',
                        color: '#059669',
                        background: 'white',
                        padding: '6px 8px',
                        borderRadius: '4px',
                        marginTop: '6px',
                        fontStyle: 'italic'
                      }}>
                        "{item.extractedInfo}"
                      </div>
                    )}

                    {item.completed && item.completedAt && (
                      <div style={{
                        fontSize: '11px',
                        color: '#9ca3af',
                        marginTop: '4px'
                      }}>
                        Completed at {new Date(item.completedAt).toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
        </div>
      ))}
    </div>
  )
}

export default ChecklistPanel
